/**
 * @file Ticket.command.ts
 * @description Команда для ручного управления тикетами.
 */

import { Inject, Injectable } from "@nestjs/common";
import {
    ChatInputCommandInteraction,
    GuildMember,
    SlashCommandBuilder,
    TextChannel,
} from "discord.js";
import { Command } from "@decorators/command.decorator";
import { ICommand } from "@interactions/interfaces/ICommand";
import { IEmbedFactory } from "@interfaces/IEmbedFactory";
import { RequiresPermission } from "@decorators/requiresPermission.decorator";
import { Permissions } from "@permissions/permissions.dictionary";
import { ITicketService } from "../interfaces/ITicketService";

@Injectable()
@Command()
export class TicketCommand implements ICommand {
    public readonly data = new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Управление тикетами.")
        .setDMPermission(false)
        .addSubcommand((sub) =>
            sub.setName("close").setDescription("Закрывает текущий тикет.")
        )
        .addSubcommand((sub) =>
            sub
                .setName("add-user")
                .setDescription("Добавляет пользователя в текущий тикет.")
                .addUserOption((opt) =>
                    opt
                        .setName("user")
                        .setDescription("Пользователь для добавления.")
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("remove-user")
                .setDescription("Удаляет пользователя из текущего тикета.")
                .addUserOption((opt) =>
                    opt
                        .setName("user")
                        .setDescription("Пользователь для удаления.")
                        .setRequired(true)
                )
        );

    constructor(
        @Inject("ITicketService")
        private readonly _ticketService: ITicketService,
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory
    ) {}

    public async execute(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        if (
            !interaction.inGuild() ||
            !(interaction.channel instanceof TextChannel)
        )
            return;

        const subcommand = interaction.options.getSubcommand();
        const member = interaction.member as GuildMember;

        try {
            switch (subcommand) {
                case "close":
                    await this._handleClose(interaction, member);
                    break;
                case "add-user":
                    await this._handleAddUser(interaction, member);
                    break;
                case "remove-user":
                    await this._handleRemoveUser(interaction, member);
                    break;
            }
        } catch (error) {
            const errorEmbed = this._embedFactory.createErrorEmbed({
                description: error.message,
                context: { user: interaction.user, guild: interaction.guild },
            });
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({
                    embeds: [errorEmbed],
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    embeds: [errorEmbed],
                    ephemeral: true,
                });
            }
        }
    }

    @RequiresPermission(Permissions.TICKET_CLOSE)
    private async _handleClose(
        interaction: ChatInputCommandInteraction,
        member: GuildMember
    ) {
        await interaction.deferReply({ ephemeral: true });
        await this._ticketService.closeTicket(
            interaction.channel as TextChannel,
            member
        );
        const embed = this._embedFactory.createSuccessEmbed({
            description: "Тикет будет закрыт в ближайшее время.",
            context: { user: member.user, guild: member.guild },
        });
        await interaction.editReply({ embeds: [embed] });
    }

    @RequiresPermission(Permissions.TICKET_ADD_USER)
    private async _handleAddUser(
        interaction: ChatInputCommandInteraction,
        member: GuildMember
    ) {
        await interaction.deferReply({ ephemeral: true });
        const userToAdd = interaction.options.getMember("user") as GuildMember;
        await this._ticketService.addUser(
            interaction.channel as TextChannel,
            userToAdd,
            member
        );
        const embed = this._embedFactory.createSuccessEmbed({
            description: `${userToAdd.toString()} был успешно добавлен в тикет.`,
            context: { user: member.user, guild: member.guild },
        });
        await interaction.editReply({ embeds: [embed] });
    }

    @RequiresPermission(Permissions.TICKET_REMOVE_USER)
    private async _handleRemoveUser(
        interaction: ChatInputCommandInteraction,
        member: GuildMember
    ) {
        await interaction.deferReply({ ephemeral: true });
        const userToRemove = interaction.options.getMember(
            "user"
        ) as GuildMember;
        await this._ticketService.removeUser(
            interaction.channel as TextChannel,
            userToRemove,
            member
        );
        const embed = this._embedFactory.createSuccessEmbed({
            description: `${userToRemove.toString()} был успешно удален из тикета.`,
            context: { user: member.user, guild: member.guild },
        });
        await interaction.editReply({ embeds: [embed] });
    }
}

