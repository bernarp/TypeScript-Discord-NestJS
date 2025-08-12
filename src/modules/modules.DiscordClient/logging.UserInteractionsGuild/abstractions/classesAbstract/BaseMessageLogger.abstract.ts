/**
 * @file BaseMessageLogger.abstract.ts
 * @description Базовый абстрактный класс для логгеров сообщений.
 * @version 2.0: Рефакторинг для использования IConfigurationService.
 */

import { Inject, Injectable, Logger } from "@nestjs/common";
import { Message, PartialMessage, EmbedBuilder, TextChannel } from "discord.js";
import { Service } from "@core/abstractions/Service";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { IClient } from "@interface/IClient";
import { IConfigurationService } from "@interface/IConfigurationService";
import { IMessageLogger } from "../interfaces/IMessageLogger.interface";
import { LogChannelType } from "../LogChannelType.enum";

@Injectable()
export abstract class BaseMessageLogger
    extends Service
    implements IMessageLogger
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
