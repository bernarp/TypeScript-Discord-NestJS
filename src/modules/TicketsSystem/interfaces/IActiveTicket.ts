/**
 * @file IActiveTicket.ts
 * @description Определяет структуру данных для одного активного тикета.
 */

import { TicketStatus } from "../enums/TicketStatus.enum";
import { TicketType } from "../enums/TicketType.enum";

export interface IActiveTicket {
    /**
     * @property channelId
     * @description Уникальный ID текстового канала, который является тикетом.
     */
    channelId: string;

    /**
     * @property guildId
     * @description ID гильдии, в которой создан тикет.
     */
    guildId: string;

    /**
     * @property creatorId
     * @description ID пользователя, который создал тикет.
     */
    creatorId: string;

    /**
     * @property participantIds
     * @description Массив ID всех участников тикета, включая создателя.
     */
    participantIds: string[];

    /**
     * @property status
     * @description Текущий статус тикета (например, OPEN, CLOSED).
     */
    status: TicketStatus;

    /**
     * @property type
     * @description Категория (тип) тикета для логического разделения.
     */
    type: TicketType;

    /**
     * @property createdAt
     * @description Дата и время создания тикета в формате ISO 8601.
     */
    createdAt: string;

    /**
     * @property closedAt
     * @description Опциональная дата и время закрытия тикета в формате ISO 8601.
     */
    closedAt?: string;

    /**
     * @property closedBy
     * @description Опциональный ID пользователя, который закрыл тикет.
     */
    closedBy?: string;
}
