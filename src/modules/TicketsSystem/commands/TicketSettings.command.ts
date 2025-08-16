/**
 * @file TicketSettings.command.ts
 * @description Команда для настройки модуля системы тикетов.
 * @version 2.0.0: Адаптирована для маппинга категорий по типам тикетов.
 */

import { Inject, Injectable } from "@nestjs/common";
import {
    ChannelType,
    ChatInputCommandInteraction,
    SlashCommandBuilder,
} from "discord.js";
import { Command } from "@decorators/command.decorator";
import { ICommand } from "@interactions/interfaces/ICommand";
import { IEmbedFactory } from "@interfaces/IEmbedFactory";
import { ITicketSettingsRepository } from "../interfaces/ITicketSettingsRepository";
import { RequiresPermission } from "@decorators/requiresPermission.decorator";
import { Permissions } from "@permissions/permissions.dictionary";
import { TicketType } from "../enums/TicketType.enum";

@Injectable()
@Command()
export class TicketSettingsCommand implements ICommand {
    public readonly data = new SlashCommandBuilder()
        .setName("ticket-settings")
        .setDescription("Настройка модуля системы тикетов.")
        .setDMPermission(false)
        .addSubcommand((sub) =>
            sub
                .setName("set-type-category")
                .setDescription(
                    "Устанавливает категорию для конкретного типа тикета."
                )
                .addStringOption((opt) =>
                    opt
                        .setName("type")
                        .setDescription("Тип тикета для настройки.")
                        .setRequired(true)
                        .addChoices(
                            {
                                name: "Техническая поддержка",
                                value: TicketType.SUPPORT,
                            },
                            { name: "Жалоба", value: TicketType.COMPLAINT },
                            { name: "Вопрос", value: TicketType.QUESTION },
                            { name: "Другое", value: TicketType.OTHER }
                        )
                )
                .addChannelOption((opt) =>
                    opt
                        .setName("category")
                        .setDescription(
                            "Категория, в которой будут создаваться эти тикеты."
                        )
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("set-moderator-role")
                .setDescription("Устанавливает роль модераторов тикетов.")
                .addRoleOption((opt) =>
                    opt
                        .setName("role")
                        .setDescription("Роль модераторов.")
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("view")
                .setDescription("Показывает текущие настройки системы тикетов.")
        );

    constructor(
        @Inject("ITicketSettingsRepository")
        private readonly _settingsRepo: ITicketSettingsRepository,
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory
    ) {}

    @RequiresPermission(Permissions.TICKET_MANAGE_SETTINGS)
    public async execute(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        if (!interaction.inGuild()) return;

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case "set-type-category": 
                await this._handleSetTypeCategory(interaction);
                break;
            case "set-moderator-role":
                await this._handleSetModeratorRole(interaction);
                break;
            case "view":
                await this._handleView(interaction);
                break;
        }
    }

    private async _handleSetTypeCategory(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        const ticketType = interaction.options.getString(
            "type",
            true
        ) as TicketType;
        const category = interaction.options.getChannel("category", true);

        const currentSettings = (await this._settingsRepo.get(
            interaction.guildId
        )) || { categoryMappings: {} };
        const newMappings = {
            ...currentSettings.categoryMappings,
            [ticketType]: category.id,
        };

        await this._settingsRepo.set(interaction.guildId, {
            categoryMappings: newMappings,
        });

        const embed = this._embedFactory.createSuccessEmbed({
            description: `Категория для тикетов типа **${ticketType}** успешно установлена на **${category.name}**.`,
            context: { user: interaction.user, guild: interaction.guild },
        });
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    private async _handleSetModeratorRole(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        const role = interaction.options.getRole("role", true);
        await this._settingsRepo.set(interaction.guildId, {
            moderatorRoleIds: [role.id],
        });
        const embed = this._embedFactory.createSuccessEmbed({
            description: `Роль модераторов тикетов успешно установлена на ${role.toString()}.`,
            context: { user: interaction.user, guild: interaction.guild },
        });
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    private async _handleView(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        const settings = await this._settingsRepo.get(interaction.guildId);
        const roles =
            settings?.moderatorRoleIds?.map((id) => `<@&${id}>`).join(", ") ||
            "Не заданы";

        const categoryDescription = Object.values(TicketType)
            .map((type) => {
                const categoryId = settings?.categoryMappings?.[type];
                return `**${type}**: ${
                    categoryId ? `<#${categoryId}>` : "Не задана"
                }`;
            })
            .join("\n");

        const embed = this._embedFactory.createInfoEmbed({
            title: "Настройки системы тикетов",
            description: `Ниже приведены текущие настройки для гильдии **${interaction.guild?.name}**.`,
            fields: [
                {
                    name: "Категории для типов тикетов",
                    value: categoryDescription,
                    inline: false,
                },
                { name: "Роли модераторов", value: roles, inline: false },
                {
                    name: "Лимит тикетов на пользователя",
                    value: `\`${settings?.maxTicketsPerUser ?? 1}\``,
                    inline: false,
                },
            ],
            context: { user: interaction.user, guild: interaction.guild },
        });
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}
