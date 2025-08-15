import { Inject, Injectable } from "@nestjs/common";
import {
    SlashCommandBuilder,
    CommandInteraction,
    ChannelType,
    TextChannel,
    ChatInputCommandInteraction,
    EmbedField,
    GuildMember,
} from "discord.js";
import { Command } from "@decorators/command.decorator";
import { ICommand } from "@interactions/interfaces/ICommand";
import { IGuildSettings } from "@settings/abstractions/IGuildSettings";
import { IEmbedFactory } from "@interfaces/IEmbedFactory";
import { IPermissionService } from "@permissions/interfaces/IPermissionService";
import { Permissions } from "@permissions/permissions.dictionary";
import { IConfigurationService } from "@config/interfaces/IConfigurationService";

const CONFIGURABLE_SETTINGS: ReadonlyArray<{
    key: keyof IGuildSettings;
    name: string;
}> = [
    { key: "logChannelId", name: "Канал для логов команд" },
    {
        key: "logChannelMessageDeleteId",
        name: "Канал логов: Удаление сообщений",
    },
    {
        key: "logChannelMessageEditId",
        name: "Канал логов: Редактирование сообщений",
    },
    {
        key: "logChannelMessageSendId",
        name: "Канал логов: Отправка сообщений (СПАМ!)",
    },
    {
        key: "logChannelInteractionId",
        name: "Канал логов: InteractionCreate",
    },
    { key: "welcomeChannelId", name: "Канал для приветствий" },
];

@Command()
@Injectable()
export class ConfigCommand implements ICommand {
    public readonly data = new SlashCommandBuilder()
        .setName("config")
        .setDescription(
            "Управляет базовыми настройками бота для этого сервера."
        )
        .setDMPermission(false)
        .addSubcommand((subcommand) =>
            subcommand
                .setName("set")
                .setDescription("Устанавливает значение для настройки канала.")
                .addStringOption((option) =>
                    option
                        .setName("setting")
                        .setDescription(
                            "Настройка, которую вы хотите изменить."
                        )
                        .setRequired(true)
                        .addChoices(
                            ...CONFIGURABLE_SETTINGS.map((s) => ({
                                name: s.name,
                                value: s.key,
                            }))
                        )
                )
                .addChannelOption((option) =>
                    option
                        .setName("value")
                        .setDescription("Новое значение (текстовый канал).")
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("view")
                .setDescription("Показывает текущие базовые настройки сервера.")
        );

    private readonly _settingNames: Map<keyof IGuildSettings, string>;

    constructor(
        @Inject("IConfigurationService")
        private readonly _configService: IConfigurationService,
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory,
        @Inject("IPermissionService")
        private readonly _permissionService: IPermissionService
    ) {
        this._settingNames = new Map(
            CONFIGURABLE_SETTINGS.map((s) => [s.key, s.name])
        );
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        if (!interaction.isChatInputCommand() || !interaction.inGuild()) return;

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case "set":
                await this._handleSet(interaction);
                break;
            case "view":
                await this._handleView(interaction);
                break;
        }
    }

    private async _handleSet(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        if (
            !(await this._permissionService.check(
                interaction.member as GuildMember,
                Permissions.CONFIG_SET
            ))
        ) {
            const errorEmbed = this._embedFactory.createErrorEmbed({
                description: "У вас недостаточно прав для изменения настроек.",
                context: { user: interaction.user, guild: interaction.guild },
            });
            await interaction.reply({ embeds: [errorEmbed], ephemeral: false });
            return;
        }

        const settingKey = interaction.options.getString(
            "setting",
            true
        ) as keyof IGuildSettings;
        const channel = interaction.options.getChannel(
            "value",
            true
        ) as TextChannel;

        await this._configService.guilds.setGuildSettings(
            interaction.guildId!,
            {
                [settingKey]: channel.id,
            }
        );

        const settingName =
            this._settingNames.get(settingKey) ?? `\`${settingKey}\``;

        const embed = this._embedFactory.createSuccessEmbed({
            description: `Настройка **${settingName}** была успешно обновлена!`,
            fields: [
                {
                    name: "Новое значение",
                    value: channel.toString(),
                    inline: false,
                },
            ],
            context: { user: interaction.user, guild: interaction.guild },
        });

        await interaction.reply({ embeds: [embed], ephemeral: false });
    }

    private async _handleView(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        if (
            !(await this._permissionService.check(
                interaction.member as GuildMember,
                Permissions.CONFIG_VIEW
            ))
        ) {
            const errorEmbed = this._embedFactory.createErrorEmbed({
                description: "У вас недостаточно прав для просмотра настроек.",
                context: { user: interaction.user, guild: interaction.guild },
            });
            await interaction.reply({ embeds: [errorEmbed], ephemeral: false });
            return;
        }

        const config = await this._configService.guilds.getGuildSettings(
            interaction.guildId!
        );

        const fields: EmbedField[] = CONFIGURABLE_SETTINGS.map((setting) => {
            const value = config?.[setting.key];
            return {
                name: `${setting.name} (\`${setting.key}\`)`,
                value: value ? `<#${value}>` : "Не настроено",
                inline: false,
            };
        });

        const embed = this._embedFactory.createInfoEmbed({
            title: `Базовые настройки для "${interaction.guild?.name}"`,
            description:
                "Ниже перечислены текущие значения конфигурации каналов.",
            fields,
            context: { user: interaction.user, guild: interaction.guild },
        });

        await interaction.reply({ embeds: [embed], ephemeral: false });
    }
}
