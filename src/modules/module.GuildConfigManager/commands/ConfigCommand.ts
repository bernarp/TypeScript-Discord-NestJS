/**
 * @file ConfigCommand.ts
 * @description Команда для управления динамической конфигурацией сервера.
 * @version 4.0: Рефакторинг для упрощения поддержки и добавления новых настроек.
 */
import { Inject, Injectable } from "@nestjs/common";
import {
    SlashCommandBuilder,
    CommandInteraction,
    ChannelType,
    PermissionFlagsBits,
    TextChannel,
    ChatInputCommandInteraction,
    EmbedField,
} from "discord.js";
import { Command } from "@decorators/command.decorator";
import { ICommand } from "@interface/ICommand";
import { IGuildConfig, IGuildSettings } from "@interface/IGuildConfig";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";

/**
 * @constant CONFIGURABLE_SETTINGS
 * @description Единый источник правды для всех настроек, управляемых этой командой.
 * Чтобы добавить новую настройку, просто добавьте объект в этот массив.
 */
const CONFIGURABLE_SETTINGS: ReadonlyArray<{
    key: keyof IGuildSettings;
    name: string;
}> = [
    {
        key: "logChannelId",
        name: "Канал для логов команд",
    },
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
    // Добавьте сюда другие настройки по мере необходимости
    // Например:
    // {
    //   key: "welcomeChannelId",
    //   name: "Канал для приветствий",
    // },
];

@Command()
@Injectable()
export class ConfigCommand implements ICommand {
    public readonly data = new SlashCommandBuilder()
        .setName("config")
        .setDescription("Управляет настройками бота для этого сервера.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addSubcommand((subcommand) =>
            subcommand
                .setName("set")
                .setDescription("Устанавливает значение для настройки.")
                .addStringOption((option) =>
                    option
                        .setName("setting")
                        .setDescription(
                            "Настройка, которую вы хотите изменить."
                        )
                        .setRequired(true)
                        // Динамически генерируем опции из единого источника
                        .addChoices(
                            ...CONFIGURABLE_SETTINGS.map((setting) => ({
                                name: setting.name,
                                value: setting.key,
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
                .setDescription("Показывает текущие настройки сервера.")
        );

    /**
     * @private
     * @description Карта для быстрого получения имени настройки по её ключу.
     */
    private readonly _settingNames: Map<keyof IGuildSettings, string>;

    constructor(
        @Inject("IGuildConfig") private readonly _guildConfig: IGuildConfig,
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory
    ) {
        // Инициализируем карту имен из единого источника при создании сервиса
        this._settingNames = new Map(
            CONFIGURABLE_SETTINGS.map((s) => [s.key, s.name])
        );
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        if (!interaction.isChatInputCommand()) return;

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

    /**
     * @private
     * @method _handleSet
     * @description Обрабатывает подкоманду /config set
     * @param {ChatInputCommandInteraction} interaction - Взаимодействие.
     */
    private async _handleSet(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        const settingKey = interaction.options.getString(
            "setting",
            true
        ) as keyof IGuildSettings;
        const channel = interaction.options.getChannel(
            "value",
            true
        ) as TextChannel;

        await this._guildConfig.set(interaction.guildId!, {
            [settingKey]: channel.id,
        });

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

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    /**
     * @private
     * @method _handleView
     * @description Обрабатывает подкоманду /config view
     * @param {ChatInputCommandInteraction} interaction - Взаимодействие.
     */
    private async _handleView(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        const config = await this._guildConfig.getAll(interaction.guildId!);

        // Динамически генерируем поля для встраиваемого сообщения
        const fields: EmbedField[] = CONFIGURABLE_SETTINGS.map((setting) => {
            const value = config?.[setting.key];
            return {
                name: `${setting.name} (\`${setting.key}\`)`,
                value: this._formatValue(value),
                inline: false,
            };
        });

        const embed = this._embedFactory.createInfoEmbed({
            title: `Настройки для сервера "${interaction.guild?.name}"`,
            description: "Ниже перечислены текущие значения конфигурации.",
            fields,
            context: { user: interaction.user, guild: interaction.guild },
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    /**
     * @private
     * @method _formatValue
     * @description Форматирует ID канала или другое значение для вывода.
     * @param {string | undefined} value - ID канала или значение.
     * @returns {string} Отформатированная строка.
     */
    private _formatValue(value?: string): string {
        return value ? `<#${value}>` : "Не настроен";
    }
}
