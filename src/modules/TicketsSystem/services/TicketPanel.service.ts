/**
 * @file TicketPanel.service.ts
 * @description Сервис, отвечающий за создание и восстановление панели для создания тикетов.
 * @version 2.1.0 (Refactored with UI layer)
 * @author System
 */

import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { AppEvents } from "@events/app.events";
import { PinnedMessageMissingEvent } from "@events/pinned-message-missing.event";
import { ILogger } from "@logger";
import { IConfigurationService } from "@settings/abstractions/IConfigurationService";
import { IClient } from "@client";
import { IEmbedFactory } from "@interfaces/IEmbedFactory";
import { TextChannel } from "discord.js";
// <<< ИМПОРТЫ UI ФАБРИК >>>
import { createTicketPanelEmbed } from "../ui/embeds/createTicketPanelEmbed";
import { createTicketPanelComponents } from "../ui/components/createTicketPanelComponents";

@Injectable()
export class TicketPanelService {
    constructor(
        @Inject("ILogger") private readonly _logger: ILogger,
        @Inject("IConfigurationService")
        private readonly _configService: IConfigurationService,
        @Inject("IClient") private readonly _client: IClient,
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory
    ) {}

    @OnEvent(AppEvents.PINNED_MESSAGE_MISSING)
    public async handleMissingPanel(
        payload: PinnedMessageMissingEvent
    ): Promise<void> {
        if (payload.messageType !== "ticketCreatePanel") {
            return;
        }
        const channelId = payload.channelId;
        if (!channelId) {
            this._logger.warn(
                `Cannot auto-recreate ticket panel for guild ${payload.guildId} because the target channel is unknown.`
            );
            return;
        }

        try {
            const channel = await this._client.channels.fetch(channelId);
            if (!channel || !(channel instanceof TextChannel)) {
                this._logger.warn(
                    `Channel ${channelId} for ticket panel in guild ${payload.guildId} not found or not a text channel.`
                );
                return;
            }

            const embed = createTicketPanelEmbed(this._embedFactory);
            const components = createTicketPanelComponents();

            const newMessage = await channel.send({
                embeds: [embed],
                components: [components],
            });

            await this._configService.guilds.setPinnedMessage(
                payload.guildId,
                "ticketCreatePanel",
                { messageId: newMessage.id, channelId: channel.id }
            );

            this._logger.inf(
                `Ticket panel successfully recreated for guild ${payload.guildId} in channel ${channel.id}.`
            );
        } catch (error) {
            this._logger.err(
                `Failed to recreate ticket panel for guild ${payload.guildId}:`,
                error.stack
            );
        }
    }
}
