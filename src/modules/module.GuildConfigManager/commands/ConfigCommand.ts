/**
 * @file ConfigCommand.ts
 * @description Команда для управления динамической конфигурацией сервера.
 * ВЕРСИЯ 2.0: Исправлены ошибки типизации.
 */
import { Inject, Injectable } from "@nestjs/common";
import {
    SlashCommandBuilder,
    CommandInteraction,
    ChannelType,
    PermissionFlagsBits,
    TextChannel,
    ChatInputCommandInteraction, // ИЗМЕНЕНИЕ: Импортируем правильный тип взаимодействия
} from "discord.js";
import { Command } from "@decorators/command.decorator";
import { ICommand } from "@interface/ICommand";
import { IGuildConfig } from "@interface/IGuildConfig";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";

@Command()
@Injectable()
export class ConfigCommand implements ICommand {
    // Тип data теперь корректно соответствует интерфейсу ICommand
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
                        .addChoices({
                            name: "Канал для логов",
                            value: "logChannelId",
                        })
                )
                .addChannelOption((option) =>
                    option
                        .setName("value")
                        .setDescription("Новое значение (канал).")
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("view")
                .setDescription("Показывает текущие настройки сервера.")
        );

    constructor(
        @Inject("IGuildConfig") private readonly _guildConfig: IGuildConfig,
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory,

    ) {}

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
     * @param {ChatInputCommandInteraction} interaction - Теперь мы используем конкретный тип.
     */
    private async _handleSet(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        const setting = interaction.options.getString(
            "setting",
            true
        ) as "logChannelId";
        const channel = interaction.options.getChannel(
            "value",
            true
        ) as TextChannel;

        await this._guildConfig.set(interaction.guildId!, {
            [setting]: channel.id,
        });

        const embed = this._embedFactory.createSuccessEmbed({
            description: `Настройка **${setting}** была успешно обновлена!`,
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
     * @param {ChatInputCommandInteraction} interaction - Теперь мы используем конкретный тип.
     */
    private async _handleView(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        const config = await this._guildConfig.getAll(interaction.guildId!);

        const logChannelId = config?.logChannelId;
        const logChannel = logChannelId ? `<#${logChannelId}>` : "Не настроен";

        const embed = this._embedFactory.createInfoEmbed({
            title: `Настройки для сервера "${interaction.guild?.name}"`,
            description: "Ниже перечислены текущие значения конфигурации.",
            fields: [
                {
                    name: "Канал для логов (`logChannelId`)",
                    value: logChannel,
                    inline: false,
                },
            ],
            context: { user: interaction.user, guild: interaction.guild },
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}
