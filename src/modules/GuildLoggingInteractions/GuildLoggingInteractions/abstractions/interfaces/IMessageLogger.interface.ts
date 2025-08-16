/**
 * @file IMessageLogger.interface.ts
 * @description Интерфейс для логгеров сообщений Discord.
 */

import { Message, PartialMessage, EmbedBuilder } from "discord.js";

export interface IMessageLogger {
    /**
     * @method isLoggable
     * @description Проверяет, подлежит ли сообщение логированию.
     * @param {Message | PartialMessage} message - Сообщение для проверки.
     * @returns {boolean}
     */
    isLoggable(message: Message | PartialMessage): boolean;

    /**
     * @method createLogEmbed
     * @description Создает embed для логирования сообщения.
     * @param {Message | PartialMessage} message - Сообщение для логирования.
     * @returns {EmbedBuilder | Promise<EmbedBuilder>}
     */
    createLogEmbed(
        message: Message | PartialMessage
    ): EmbedBuilder | Promise<EmbedBuilder>;
}
