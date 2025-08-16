/**
 * @file Ticket.service.ts
 * @description Реализация сервиса бизнес-логики для управления тикетами.
 * @version 2.3.0 (Added channel deletion after a 5-second delay)
 */

import { Inject, Injectable } from "@nestjs/common";
import {
    ChannelType,
    GuildMember,
    OverwriteResolvable,
    PermissionFlagsBits,
    TextChannel,
} from "discord.js";
import { ILogger } from "@logger";
import { IClient } from "@client";
import { IEmbedFactory } from "@interfaces/IEmbedFactory";
import { ITicketService } from "..//interfaces/ITicketService";
import { ITicketRepository } from "..//interfaces/ITicketRepository";
import { ITicketSettingsRepository } from "..//interfaces/ITicketSettingsRepository";
import { TicketStatus } from "..//enums/TicketStatus.enum";
import { TicketType } from "..//enums/TicketType.enum";
import { createWelcomeTicketEmbed } from "../ui/embeds/createWelcomeTicketEmbed";
import { createTicketActionRow } from "../ui/components/createTicketActionRow";
import { createTicketClosedEmbed } from "../ui/embeds/createTicketClosedEmbed";

@Injectable()
export class TicketService implements ITicketService {
    constructor(
        @Inject("ITicketRepository")
        private readonly _ticketRepo: ITicketRepository,
        @Inject("ITicketSettingsRepository")
        private readonly _settingsRepo: ITicketSettingsRepository,
        @Inject("IClient") private readonly _client: IClient,
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory,
        @Inject("ILogger") private readonly _logger: ILogger
    ) {}

    public async createTicket(
        member: GuildMember,
        type: TicketType
    ): Promise<TextChannel> {
        const { guild } = member;
        const settings = await this._settingsRepo.get(guild.id);

        const categoryId = settings?.categoryMappings?.[type];
        if (!categoryId) {
            throw new Error(
                `Система тикетов не настроена: категория для типа тикетов "${type}" не указана.`
            );
        }

        const maxTickets = settings?.maxTicketsPerUser ?? 1;
        const userTickets = await this._ticketRepo.findByUser(
            member.id,
            guild.id
        );
        if (userTickets.length >= maxTickets) {
            throw new Error(
                `Вы достигли лимита в ${maxTickets} открытых тикетов.`
            );
        }

        const permissionOverwrites: OverwriteResolvable[] = [
            {
                id: guild.roles.everyone,
                deny: [PermissionFlagsBits.ViewChannel],
            },
            {
                id: this._client.user!.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ManageChannels,
                ],
            },
            {
                id: member.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.AttachFiles,
                ],
            },
            ...(settings?.moderatorRoleIds?.map((roleId) => ({
                id: roleId,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.ManageMessages,
                ],
            })) || []),
        ];

        const channel = await guild.channels.create({
            name: `${type.toLowerCase()}-${member.user.username}`,
            type: ChannelType.GuildText,
            parent: categoryId,
            permissionOverwrites,
            topic: `Тикет пользователя ${member.user.tag} (ID: ${member.id}). Тип: ${type}.`,
        });

        await this._ticketRepo.create({
            channelId: channel.id,
            guildId: guild.id,
            creatorId: member.id,
            participantIds: [member.id],
            type: type,
        });

        const welcomeEmbed = createWelcomeTicketEmbed(
            this._embedFactory,
            member,
            channel
        );
        const row = createTicketActionRow(channel);

        await channel.send({
            content:
                settings?.moderatorRoleIds
                    ?.map((id) => `<@&${id}>`)
                    .join(" ") || "",
            embeds: [welcomeEmbed],
            components: [row],
        });

        this._logger.inf(`Ticket ${channel.id} created by ${member.user.tag}.`);
        return channel;
    }

    public async closeTicket(
        channel: TextChannel,
        member: GuildMember
    ): Promise<void> {
        const ticket = await this._ticketRepo.findById(channel.id);
        if (!ticket || ticket.status === TicketStatus.CLOSED) {
            throw new Error("Этот канал не является активным тикетом.");
        }

        // TODO: Добавить проверку прав на закрытие (создатель или модератор)

        await this._ticketRepo.update(channel.id, {
            status: TicketStatus.CLOSED,
            closedAt: new Date().toISOString(),
            closedBy: member.id,
        });

        await channel.permissionOverwrites.edit(ticket.creatorId, {
            SendMessages: false,
        });

        const closeEmbed = createTicketClosedEmbed(this._embedFactory, member);
        await channel.send({ embeds: [closeEmbed] });
        this._logger.inf(`Ticket ${channel.id} closed by ${member.user.tag}.`);

        // VVV НОВЫЙ БЛОК: Логика отложенного удаления VVV
        this._logger.inf(
            `Scheduling deletion for channel ${channel.id} in 5 seconds.`
        );

        setTimeout(async () => {
            try {
                await channel.delete(
                    `Тикет закрыт пользователем ${member.user.tag}`
                );
                // После успешного удаления канала, удаляем запись из нашей БД
                await this._ticketRepo.delete(channel.id);
                this._logger.inf(
                    `Successfully deleted channel and ticket data for ${channel.id}.`
                );
            } catch (error) {
                this._logger.warn(
                    `Could not delete ticket channel ${channel.id}. It might have been deleted manually.`,
                    error.stack
                );
                await this._ticketRepo.delete(channel.id);
            }
        }, 5000);
    }

    public async addUser(
        channel: TextChannel,
        userToAdd: GuildMember,
        responsibleMember: GuildMember
    ): Promise<void> {
        const ticket = await this._ticketRepo.findById(channel.id);
        if (!ticket) throw new Error("Этот канал не является тикетом.");

        await channel.permissionOverwrites.edit(userToAdd.id, {
            ViewChannel: true,
            SendMessages: true,
        });

        await this._ticketRepo.update(channel.id, {
            participantIds: [
                ...new Set([...ticket.participantIds, userToAdd.id]),
            ],
        });

        await channel.send({
            embeds: [
                this._embedFactory.createInfoEmbed({
                    description: `${userToAdd.toString()} был добавлен в тикет модератором ${responsibleMember.toString()}.`,
                    context: {
                        user: responsibleMember.user,
                        guild: channel.guild,
                    },
                }),
            ],
        });
    }

    public async removeUser(
        channel: TextChannel,
        userToRemove: GuildMember,
        responsibleMember: GuildMember
    ): Promise<void> {
        const ticket = await this._ticketRepo.findById(channel.id);
        if (!ticket) throw new Error("Этот канал не является тикетом.");

        await channel.permissionOverwrites.delete(userToRemove.id);

        await this._ticketRepo.update(channel.id, {
            participantIds: ticket.participantIds.filter(
                (id) => id !== userToRemove.id
            ),
        });

        await channel.send({
            embeds: [
                this._embedFactory.createInfoEmbed({
                    description: `${userToRemove.toString()} был удален из тикета модератором ${responsibleMember.toString()}.`,
                    context: {
                        user: responsibleMember.user,
                        guild: channel.guild,
                    },
                }),
            ],
        });
    }
}
