/**
 * @file message-create.event.ts
 * @description Определяет класс события, генерируемого при создании нового сообщения.
 */
import { Message } from "discord.js";

export class MessageCreateEvent {
    /**
     * @param {Message} message - Объект созданного сообщения.
     */
    constructor(public readonly message: Message) {}
}
