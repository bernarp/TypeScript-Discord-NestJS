/**
 * @file message-update.event.ts
 * @description Определяет класс события, генерируемого при редактировании сообщения.
 */
import { Message, PartialMessage } from "discord.js";

export class MessageUpdateEvent {
    /**
     * @param {Message | PartialMessage} oldMessage - Сообщение до редактирования. Может быть частичным, если сообщение не было в кэше.
     * @param {Message | PartialMessage} newMessage - Сообщение после редактирования.
     */
    constructor(
        public readonly oldMessage: Message | PartialMessage,
        public readonly newMessage: Message | PartialMessage
    ) {}
}
