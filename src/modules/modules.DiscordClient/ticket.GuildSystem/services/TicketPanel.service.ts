// ЯВЛЯЕТСЯ ТЕСТОВЫМ ФАЙЛОМ.
// ЯВЛЯЕТСЯ ТЕСТОВЫМ ФАЙЛОМ.
// ЯВЛЯЕТСЯ ТЕСТОВЫМ ФАЙЛОМ.

import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { AppEvents } from "@/event.EventBus/app.events";
import { PinnedMessageMissingEvent } from "@/event.EventBus/pinned-message-missing.event";
import { ILogger } from "@interface/logger/ILogger";
import { IConfigurationService } from "@interface/IConfigurationService";
import { IClient } from "@interface/IClient";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { TextChannel } from "discord.js";

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
                `Cannot auto-recreate ticket panel for guild ${payload.guildId} because the target channel is unknown. ` +
                    `Use the /pinned-message command to create it manually.`
            );
            return;
        }

        this._logger.inf(
            `Recreating TEST ticket panel for guild ${payload.guildId} in channel ${channelId}...`
        );

        try {
            const channel = await this._client.channels.fetch(channelId);
            if (!channel || !(channel instanceof TextChannel)) {
                this._logger.warn(
                    `Channel ${channelId} for ticket panel in guild ${payload.guildId} not found or not a text channel.`
                );
                return;
            }

            const embed = this._embedFactory.createInfoEmbed({
                title: "Тестовая панель тикетов",
                description:
                    "Эта панель была успешно создана или восстановлена системой.\n\n" +
                    `**Guild ID:** ${payload.guildId}\n` +
                    `**Channel ID:** ${channel.id}`,
            });

            const newMessage = await channel.send({
                embeds: [embed],
                components: [],
            });

            await this._configService.setPinnedMessage(
                payload.guildId,
                "ticketCreatePanel",
                {
                    messageId: newMessage.id,
                    channelId: channel.id,
                }
            );

            this._logger.inf(
                `TEST Ticket panel successfully recreated for guild ${payload.guildId} in channel ${channel.id}.`
            );
        } catch (error) {
            this._logger.err(
                `Failed to recreate TEST ticket panel for guild ${payload.guildId}:`,
                error.stack
            );
        }
    }
}
