/**
 * @file BaseMessageLogger.abstract.ts
 * @description Базовый абстрактный класс для логгеров сообщений.
 * @version 2.2 (Refactored for new ConfigService)
 * @author System
 */

import { Inject, Injectable } from "@nestjs/common";
import { Message, PartialMessage, EmbedBuilder, TextChannel } from "discord.js";
import { Service } from "@common/classes/Service";
import { IEmbedFactory } from "@interfaces/IEmbedFactory";
import { IClient } from "@client";
import { IConfigurationService } from "@settings/abstractions/IConfigurationService";
import { IMessageLogger } from "../interfaces/IMessageLogger.interface";
import { LogChannelType } from "../LogChannelType.enum";
import { ILogger } from "@logger";

@Injectable()
export abstract class BaseMessageLogger
    extends Service
    implements IMessageLogger
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

    public isLoggable(message: Message | PartialMessage): boolean {
        return !!(
            message.guild &&
            message.guildId &&
            message.author &&
            !message.author.bot
        );
    }

    public abstract createLogEmbed(
        message: Message | PartialMessage,
        ...args: any[]
    ): EmbedBuilder | Promise<EmbedBuilder>;

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

    protected truncateContent(
        content: string | null,
        maxLength: number = 1000
    ): string {
        if (!content) {
            return "Содержимое недоступно.";
        }
        if (content.length > maxLength) {
            return content.substring(0, maxLength - 3) + "...";
        }
        return content;
    }
}
