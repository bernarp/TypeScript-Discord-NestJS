/**
 * @file BaseInteractionLogger.abstract.ts
 * @description Базовый абстрактный класс для логгеров взаимодействий.
 * @version 2.2 (Refactored for new ConfigService)
 * @author System
 */

import { Inject, Injectable } from "@nestjs/common";
import { BaseInteraction, EmbedBuilder, TextChannel } from "discord.js";
import { Service } from "@core/abstractions/Service";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { IClient } from "@interface/IClient";
import { IConfigurationService } from "@interface/config/IConfigurationService";
import { IInteractionLogger } from "../interfaces/IInteractionLogger.interface";
import { LogChannelType } from "../LogChannelType.enum";
import { InteractionCreateEvent } from "@/event.EventBus/interaction-create.eventv2";
import { ILogger } from "@logger/";

@Injectable()
export abstract class BaseInteractionLogger
    extends Service
    implements IInteractionLogger
{
    constructor(
        @Inject("IEmbedFactory")
        protected readonly _embedFactory: IEmbedFactory,
        @Inject("IClient")
        protected readonly _client: IClient,
        @Inject("IConfigurationService")
        protected readonly _configService: IConfigurationService,
        @Inject("ILogger")
        protected readonly _logger: ILogger
    ) {
        super();
    }

    public abstract onInteractionCreated(
        payload: InteractionCreateEvent
    ): Promise<void>;
    public abstract createLogEmbed(interaction: BaseInteraction): EmbedBuilder;

    protected async getLogChannelId(
        guildId: string,
        channelType: LogChannelType
    ): Promise<string | undefined> {
        const settings = await this._configService.guilds.getGuildSettings(
            guildId
        );
        return settings?.[channelType];
    }

    protected async sendLog(
        channelId: string,
        guildId: string,
        embed: EmbedBuilder
    ): Promise<void> {
        try {
            const logChannel = await this._client.channels.fetch(channelId);

            if (!(logChannel instanceof TextChannel)) {
                this._logger.warn(
                    `Channel ${channelId} is not a text channel for guild ${guildId}.`
                );
                return;
            }

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            this._logger.err(
                `Failed to send log message to channel ${channelId} for guild ${guildId}:`,
                error.stack
            );
        }
    }

    protected isInteractionLoggable(interaction: BaseInteraction): boolean {
        return !!(
            interaction.inGuild() &&
            interaction.user &&
            !interaction.user.bot
        );
    }
}
