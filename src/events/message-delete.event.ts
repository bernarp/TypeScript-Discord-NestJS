/**
 * @file message-delete.event.ts
 * @description Определяет класс события, генерируемого при удалении сообщения.
 */
import { Message, PartialMessage } from "discord.js";

export class MessageDeleteEvent {
    /**
     * @param {Message | PartialMessage} deletedMessage - Удаленное сообщение. Может быть частичным, если сообщение не было в кэше.
     */
    constructor(public readonly deletedMessage: Message | PartialMessage) {}
}
