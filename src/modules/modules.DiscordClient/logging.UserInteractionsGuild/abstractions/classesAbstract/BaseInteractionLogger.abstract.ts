/**
 * @file BaseInteractionLogger.abstract.ts
 * @description Базовый абстрактный класс для логгеров взаимодействий.
 * @version 2.0: Рефакторинг для использования IConfigurationService.
 */

import { Inject, Injectable, Logger } from "@nestjs/common";
import { BaseInteraction, EmbedBuilder, TextChannel } from "discord.js";
import { Service } from "@core/abstractions/Service";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { IClient } from "@interface/IClient";
import { IConfigurationService } from "@interface/IConfigurationService";
import { IInteractionLogger } from "../interfaces/IInteractionLogger.interface";
import { LogChannelType } from "../LogChannelType.enum";
import { InteractionCreateEvent } from "@/event.EventBus/interaction-create.eventv2";

@Injectable()
export abstract class BaseInteractionLogger
    extends Service
    implements IInteractionLogger
{
    protected readonly _logger: Logger;

    constructor(
        @Inject("IEmbedFactory")
        protected readonly _embedFactory: IEmbedFactory,
        @Inject("IClient")
        protected readonly _client: IClient,
        @Inject("IConfigurationService")
        protected readonly _configService: IConfigurationService
    ) {
        super();
        this._logger = new Logger(this.constructor.name);
    }

    public abstract onInteractionCreated(
        payload: InteractionCreateEvent
    ): Promise<void>;

    public abstract createLogEmbed(interaction: BaseInteraction): EmbedBuilder;

    protected async getLogChannelId(
        guildId: string,
        channelType: LogChannelType
    ): Promise<string | undefined> {
        return this._configService.getGuildSetting(guildId, channelType);
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
            this._logger.error(
                `Failed to send log message to channel ${channelId} for guild ${guildId}:`,
                error
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
