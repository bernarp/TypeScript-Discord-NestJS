import { Inject, Injectable } from "@nestjs/common";
import {
    SlashCommandBuilder,
    CommandInteraction,
    ChatInputCommandInteraction,
    GuildMember,
    ChannelType,
    TextChannel,
} from "discord.js";
import { Command } from "@decorators/command.decorator";
import { ICommand } from "@interactions/interfaces/ICommand";
import { IEmbedFactory } from "@interfaces/IEmbedFactory";
import { IPermissionService } from "@permissions/interfaces/IPermissionService";
import { Permissions } from "@permissions/permissions.dictionary";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AppEvents } from "@events/app.events";
import { PinnedMessageMissingEvent } from "@events/pinned-message-missing.event";
import { IConfigurationService } from "@config/interfaces/IConfigurationService";
import { IGuildSettings } from "@settings/abstractions/IGuildSettings";
import { ILogger } from "@logger";
import { IClient } from "@client";

const MANAGEABLE_PANELS: {
    name: string;
    value: keyof Required<IGuildSettings>["pinnedMessages"];
}[] = [
    { name: "Панель создания тикетов", value: "ticketCreatePanel" },
    { name: "Панель выбора ролей", value: "roleSelectPanel" },
];

@Injectable()
@Command()
export class PinnedMessageCommand implements ICommand {
    // ... (код класса остается без изменений, кроме импортов)
    public readonly data = new SlashCommandBuilder()
        .setName("pinned-message")
        .setDescription("Управляет самовосстанавливающимися панелями.")
        .setDMPermission(false)
        .addSubcommand((sub) =>
            sub
                .setName("create")
                .setDescription(
                    "Создает или пересоздает указанную панель в канале."
                )
                .addStringOption((opt) =>
                    opt
                        .setName("panel_type")
                        .setDescription("Тип панели, которую нужно создать.")
                        .setRequired(true)
                        .addChoices(...MANAGEABLE_PANELS)
                )
                .addChannelOption((opt) =>
                    opt
                        .setName("channel")
                        .setDescription(
                            "Канал, в котором будет размещена панель."
                        )
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("delete")
                .setDescription(
                    "Удаляет панель и отключает ее авто-восстановление."
                )
                .addStringOption((opt) =>
                    opt
                        .setName("panel_type")
                        .setDescription("Тип панели, которую нужно удалить.")
                        .setRequired(true)
                        .addChoices(...MANAGEABLE_PANELS)
                )
        );

    constructor(
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory,
        @Inject("IPermissionService")
        private readonly _permissionService: IPermissionService,
        @Inject("IConfigurationService")
        private readonly _configService: IConfigurationService,
        @Inject("ILogger") private readonly _logger: ILogger,
        @Inject("IClient") private readonly _client: IClient,
        private readonly _eventEmitter: EventEmitter2
    ) {}

    public async execute(interaction: CommandInteraction): Promise<void> {
        if (!interaction.isChatInputCommand() || !interaction.inGuild()) return;

        const subcommand = interaction.options.getSubcommand();

        if (
            !(await this._permissionService.check(
                interaction.member as GuildMember,
                Permissions.ADMIN_ALL // Пример, можно вынести в отдельное право
            ))
        ) {
            const errorEmbed = this._embedFactory.createErrorEmbed({
                description: "У вас недостаточно прав для управления панелями.",
                context: { user: interaction.user, guild: interaction.guild },
            });
            await interaction.reply({ embeds: [errorEmbed], ephemeral: false });
            return;
        }

        switch (subcommand) {
            case "create":
                await this._handleCreate(interaction);
                break;
            case "delete":
                await this._handleDelete(interaction);
                break;
        }
    }

    private async _handleCreate(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        await interaction.deferReply({ ephemeral: false });

        const panelType = interaction.options.getString(
            "panel_type",
            true
        ) as keyof Required<IGuildSettings>["pinnedMessages"];
        const channel = interaction.options.getChannel("channel", true);

        await this._configService.guilds.deletePinnedMessage(
            interaction.guildId,
            panelType
        );

        this._eventEmitter.emit(
            AppEvents.PINNED_MESSAGE_MISSING,
            new PinnedMessageMissingEvent(
                interaction.guildId,
                panelType,
                channel.id
            )
        );

        this._logger.inf(
            `User ${interaction.user.tag} triggered recreation of panel '${panelType}' in channel ${channel.id}.`
        );

        const successEmbed = this._embedFactory.createSuccessEmbed({
            title: "Панель в процессе создания",
            description: `Запрос на создание панели **"${this._getPanelName(
                panelType
            )}"** в канале ${channel.toString()} был успешно отправлен.`,
            context: { user: interaction.user, guild: interaction.guild },
        });

        await interaction.editReply({ embeds: [successEmbed] });
    }

    private async _handleDelete(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        await interaction.deferReply({ ephemeral: false });

        const panelType = interaction.options.getString(
            "panel_type",
            true
        ) as keyof Required<IGuildSettings>["pinnedMessages"];

        const guildSettings = await this._configService.guilds.getGuildSettings(
            interaction.guildId
        );
        const pinnedMessageConfig = guildSettings?.pinnedMessages?.[panelType];

        let messageDeleted = false;
        let messageDeletionError: string | null = null;

        if (pinnedMessageConfig) {
            try {
                const channel = await this._client.channels.fetch(
                    pinnedMessageConfig.channelId
                );

                if (channel && channel instanceof TextChannel) {
                    const message = await channel.messages.fetch(
                        pinnedMessageConfig.messageId
                    );
                    await message.delete();
                    messageDeleted = true;

                    this._logger.inf(
                        `Deleted pinned message ${pinnedMessageConfig.messageId} for panel '${panelType}' in channel ${pinnedMessageConfig.channelId}.`
                    );
                } else {
                    messageDeletionError =
                        "Канал не найден или не является текстовым каналом.";
                }
            } catch (error) {
                if (error.code === 10008) {
                    messageDeletionError = "Сообщение уже было удалено ранее.";
                } else if (error.code === 10003) {
                    messageDeletionError = "Канал не найден.";
                } else if (error.code === 50013) {
                    messageDeletionError =
                        "Недостаточно прав для удаления сообщения.";
                } else {
                    messageDeletionError = `Ошибка при удалении сообщения: ${error.message}`;
                }

                this._logger.warn(
                    `Could not delete pinned message for panel '${panelType}':`,
                    error.stack
                );
            }
        } else {
            messageDeletionError = "Панель не найдена в конфигурации.";
        }

        await this._configService.guilds.deletePinnedMessage(
            interaction.guildId,
            panelType
        );

        this._logger.inf(
            `User ${interaction.user.tag} deleted configuration for panel '${panelType}'.`
        );

        let description = `Конфигурация панели **"${this._getPanelName(
            panelType
        )}"** была удалена. Система больше не будет пытаться ее восстановить.\n\n`;

        if (messageDeleted) {
            description +=
                "✅ **Сообщение также было успешно удалено из Discord.**";
        } else if (messageDeletionError) {
            description += `⚠️ **Внимание:** Сообщение в Discord не было удалено.\n**Причина:** ${messageDeletionError}`;
        }

        const successEmbed = this._embedFactory.createSuccessEmbed({
            title: "Конфигурация панели удалена",
            description: description,
            context: { user: interaction.user, guild: interaction.guild },
        });

        await interaction.editReply({ embeds: [successEmbed] });
    }

    private _getPanelName(panelType: string): string {
        return (
            MANAGEABLE_PANELS.find((p) => p.value === panelType)?.name ||
            panelType
        );
    }
}