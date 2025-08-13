/**
 * @file PinnedMessageValidator.service.ts
 * @version 1.3.0: Теперь передает channelId в событие PinnedMessageMissingEvent для авто-восстановления.
 * @author System
 */

import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { IClient } from "@interface/IClient";
import { IConfigurationService } from "@interface/IConfigurationService";
import { ILogger } from "@interface/logger/ILogger";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AppEvents } from "@/event.EventBus/app.events";
import { PinnedMessageMissingEvent } from "@/event.EventBus/pinned-message-missing.event";
import { TextChannel } from "discord.js";
import { IGuildSettings } from "@type/IGuildSettings";

@Injectable()
export class PinnedMessageValidatorService {
    constructor(
        @Inject("IConfigurationService")
        private readonly _configService: IConfigurationService,
        @Inject("IClient")
        private readonly _client: IClient,
        @Inject("ILogger")
        private readonly _logger: ILogger,
        private readonly _eventEmitter: EventEmitter2
    ) {}

    @OnEvent(AppEvents.CLIENT_READY)
    public async onClientReady(): Promise<void> {
        this._logger.inf(
            "Client is ready. Starting validation of all pinned messages..."
        );

        const allGuildConfigs = await this._configService.getAllGuildConfigs();

        if (allGuildConfigs.length === 0) {
            this._logger.inf(
                "No guild configurations found, skipping validation."
            );
            return;
        }

        await Promise.all(
            allGuildConfigs.map(([guildId, config]) =>
                this._validateGuildMessages(guildId, config.pinnedMessages)
            )
        );

        this._logger.inf("Pinned messages validation completed.");
    }

    private async _validateGuildMessages(
        guildId: string,
        pinnedMessages: IGuildSettings["pinnedMessages"]
    ): Promise<void> {
        if (!pinnedMessages || Object.keys(pinnedMessages).length === 0) {
            return;
        }

        const messageTypes = Object.keys(pinnedMessages) as Array<
            keyof typeof pinnedMessages
        >;

        for (const type of messageTypes) {
            const config = pinnedMessages[type];
            if (!config) continue;

            const messageExists = await this._checkMessageExists(
                guildId,
                config.channelId,
                config.messageId
            );

            if (messageExists) {
                this._logger.debug(
                    `Pinned message '${type}' for guild ${guildId} found and is valid.`
                );
            } else {
                this._logger.warn(
                    `Pinned message '${type}' for guild ${guildId} is MISSING. Emitting event for auto-recreation...`
                );

                await this._configService.deletePinnedMessage(guildId, type);
                this._eventEmitter.emit(
                    AppEvents.PINNED_MESSAGE_MISSING,
                    new PinnedMessageMissingEvent(
                        guildId,
                        type,
                        config.channelId
                    )
                );
            }
        }
    }

    private async _checkMessageExists(
        guildId: string,
        channelId: string,
        messageId: string
    ): Promise<boolean> {
        try {
            const channel = await this._client.channels.fetch(channelId);
            if (!channel || !(channel instanceof TextChannel)) {
                this._logger.warn(
                    `Channel ${channelId} for guild ${guildId} not found or not a text channel.`
                );
                return false;
            }

            await channel.messages.fetch(messageId);
            return true;
        } catch (error) {
            if (error.code === 10008) {
                return false;
            } else {
                this._logger.err(
                    `An unexpected error occurred while fetching message ${messageId} in channel ${channelId} for guild ${guildId}:`,
                    error.stack
                );
                return false;
            }
        }
    }
}
