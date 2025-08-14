/**
 * @file PinnedMessageCommand.ts
 * @description Команда для управления "самовосстанавливающимися" сообщениями-панелями.
 * @version 1.2.0 (Refactored for new ConfigService)
 * @author System
 */
import { Inject, Injectable } from "@nestjs/common";
import {
    SlashCommandBuilder,
    CommandInteraction,
    ChatInputCommandInteraction,
    GuildMember,
    ChannelType,
} from "discord.js";
import { Command } from "@decorators/command.decorator";
import { ICommand } from "@interface/ICommand";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { IPermissionService } from "../abstractions/IPermissionService";
import { Permissions } from "@permissions/permissions.dictionary";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AppEvents } from "@/event.EventBus/app.events";
import { PinnedMessageMissingEvent } from "@/event.EventBus/pinned-message-missing.event";
import { IConfigurationService } from "@interface/config/IConfigurationService";
import { IGuildSettings } from "@type/IGuildSettings";
import { ILogger } from "@interface/logger/ILogger";

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
        private readonly _eventEmitter: EventEmitter2
    ) {}

    public async execute(interaction: CommandInteraction): Promise<void> {
        if (!interaction.isChatInputCommand() || !interaction.inGuild()) return;

        const subcommand = interaction.options.getSubcommand();

        if (
            !(await this._permissionService.check(
                interaction.member as GuildMember,
                Permissions.ADMIN_ALL
            ))
        ) {
            const errorEmbed = this._embedFactory.createErrorEmbed({
                description: "У вас недостаточно прав для управления панелями.",
                context: { user: interaction.user, guild: interaction.guild },
            });
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
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
        await interaction.deferReply({ ephemeral: true });

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
        const panelType = interaction.options.getString(
            "panel_type",
            true
        ) as keyof Required<IGuildSettings>["pinnedMessages"];

        await this._configService.guilds.deletePinnedMessage(
            interaction.guildId,
            panelType
        );

        this._logger.inf(
            `User ${interaction.user.tag} deleted configuration for panel '${panelType}'.`
        );

        const successEmbed = this._embedFactory.createSuccessEmbed({
            title: "Конфигурация панели удалена",
            description:
                `Запись о панели **"${this._getPanelName(
                    panelType
                )}"** была удалена. ` +
                `Система больше не будет пытаться ее восстановить.\n\n` +
                `**Важно:** Само сообщение в Discord не было удалено. Вы должны удалить его вручную, если это необходимо.`,
            context: { user: interaction.user, guild: interaction.guild },
        });

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    }

    private _getPanelName(panelType: string): string {
        return (
            MANAGEABLE_PANELS.find((p) => p.value === panelType)?.name ||
            panelType
        );
    }
}
