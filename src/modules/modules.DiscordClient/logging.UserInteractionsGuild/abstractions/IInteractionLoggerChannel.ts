/**
 * @file AbstractMessageLogger.service.ts
 * @description Абстрактный базовый класс для всех сервисов логирования сообщений.
 * Инкапсулирует общую логику отправки логов.
 */
import { Inject, Injectable, Logger } from "@nestjs/common";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { IClient } from "@interface/IClient";
import { IGuildConfig } from "@interface/IGuildConfig";
import { TextChannel, Message, PartialMessage, EmbedBuilder } from "discord.js";
import { Service } from "@core/abstractions/Service";

@Injectable()
export abstract class IInteractionLoggerChannel extends Service {
    protected readonly _logger: Logger;

    constructor(
        @Inject("IEmbedFactory")
        protected readonly _embedFactory: IEmbedFactory,
        @Inject("IClient") protected readonly _client: IClient,
        @Inject("IGuildConfig") protected readonly _guildConfig: IGuildConfig
    ) {
        super();
        this._logger = new Logger(this.constructor.name);
    }

    /**
     * @protected
     * @method _isLoggable
     * @description Проверяет, подлежит ли сообщение логированию (не бот, есть автор и сервер).
     * @param {Message | PartialMessage} message - Сообщение для проверки.
     * @returns {boolean} True, если сообщение нужно логировать.
     */
    protected _isLoggable(message: Message | PartialMessage): boolean {
        return !!(
            message.guild &&
            message.guildId &&
            message.author &&
            !message.author.bot
        );
    }

    /**
     * @protected
     * @method _sendLog
     * @description Отправляет embed в указанный канал логов. Этот метод реализует принцип DRY.
     * @param {string} channelId - ID канала для логов.
     * @param {string} guildId - ID сервера.
     * @param {EmbedBuilder} embed - Сообщение для отправки.
     */
    protected async _sendLog(
        channelId: string,
        guildId: string,
        embed: EmbedBuilder
    ): Promise<void> {
        try {
            const logChannel = await this._client.channels.fetch(channelId);
            if (logChannel instanceof TextChannel) {
                await logChannel.send({ embeds: [embed] });
            } else {
                this._logger.warn(
                    `Channel ${channelId} is not a text channel for guild ${guildId}.`
                );
            }
        } catch (error) {
            this._logger.error(
                `Failed to send log message to channel ${channelId} for guild ${guildId}:`,
                error
            );
        }
    }
}
