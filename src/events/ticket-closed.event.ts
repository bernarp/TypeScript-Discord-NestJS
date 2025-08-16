/**
 * @file ticket-closed.event.ts
 * @description Класс-контейнер для данных о событии закрытия тикета.
 */

import { User } from "discord.js";

export class TicketClosedEvent {
    /**
     * @constructor
     * @param {string} guildId - ID сервера, где был закрыт тикет.
     * @param {string} transcriptFilePath - Полный путь к временному файлу с логом переписки.
     * @param {User} creator - Объект пользователя, создавшего тикет.
     * @param {User} closer - Объект пользователя, закрывшего тикет.
     * @param {string} channelName - Имя удаленного канала.
     * @param {string} createdAt - Время создания тикета в формате ISO.
     */
    constructor(
        public readonly guildId: string,
        public readonly transcriptFilePath: string,
        public readonly creator: User,
        public readonly closer: User,
        public readonly channelName: string,
        public readonly createdAt: string
    ) {}
}
