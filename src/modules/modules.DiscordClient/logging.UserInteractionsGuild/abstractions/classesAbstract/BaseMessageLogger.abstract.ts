/**
 * @file BaseMessageLogger.abstract.ts
 * @description Базовый абстрактный класс для логгеров сообщений.
 */

import { Inject, Injectable, Logger } from "@nestjs/common";
import { Message, PartialMessage, EmbedBuilder, TextChannel } from "discord.js";
import { Service } from "@core/abstractions/Service";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { IClient } from "@interface/IClient";
import { IGuildConfig } from "@interface/IGuildConfig";
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
        @Inject("IGuildConfig")
        protected readonly _guildConfig: IGuildConfig
    ) {
        super();
        this._logger = new Logger(this.constructor.name);
    }

    /**
     * @method isLoggable
     * @description Проверяет, подлежит ли сообщение логированию.
     * @param {Message | PartialMessage} message - Сообщение для проверки.
     * @returns {boolean}
     */
    public isLoggable(message: Message | PartialMessage): boolean {
        return !!(
            message.guild &&
            message.guildId &&
            message.author &&
            !message.author.bot
        );
    }

    /**
     * @abstract
     * @method createLogEmbed
     * @description Создает embed для логирования сообщения.
     */
    public abstract createLogEmbed(
        message: Message | PartialMessage
    ): EmbedBuilder | Promise<EmbedBuilder>;

    /**
     * @protected
     * @method getLogChannelId
     * @description Получает ID канала логирования для указанного типа.
     * @param {string} guildId - ID гильдии.
     * @param {LogChannelType} channelType - Тип канала логирования.
     * @returns {Promise<string | undefined>}
     */
    protected async getLogChannelId(
        guildId: string,
        channelType: LogChannelType
    ): Promise<string | undefined> {
        return (await this._guildConfig.get(guildId, channelType)) as
            | string
            | undefined;
    }

    /**
     * @protected
     * @method sendLog
     * @description Отправляет embed в канал логирования.
     * @param {string} channelId - ID канала.
     * @param {string} guildId - ID гильдии.
     * @param {EmbedBuilder} embed - Embed для отправки.
     * @returns {Promise<void>}
     */
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

    /**
     * @protected
     * @method truncateContent
     * @description Обрезает содержимое сообщения до указанной длины.
     * @param {string | null} content - Содержимое сообщения.
     * @param {number} maxLength - Максимальная длина (по умолчанию 1000).
     * @returns {string}
     */
    protected truncateContent(
        content: string | null,
        maxLength: number = 1000
    ): string {
        return content?.substring(0, maxLength) || "Содержимое недоступно.";
    }
}
