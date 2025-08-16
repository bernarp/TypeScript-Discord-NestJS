/**
 * @file ITicketRepository.ts
 * @description Контракт для репозитория, управляющего данными об активных тикетах.
 */

import { IActiveTicket } from "./IActiveTicket";

export interface ITicketRepository {
    /**
     * @method create
     * @description Создает и сохраняет новую запись о тикете.
     * @param {Omit<IActiveTicket, "createdAt" | "status">} ticketData - Данные для создания тикета.
     * @returns {Promise<IActiveTicket>} Созданный объект тикета.
     */
    create(
        ticketData: Omit<IActiveTicket, "createdAt" | "status">
    ): Promise<IActiveTicket>;

    /**
     * @method findById
     * @description Находит тикет по ID его канала.
     * @param {string} channelId - ID канала тикета.
     * @returns {Promise<IActiveTicket | null>} Объект тикета или null, если не найден.
     */
    findById(channelId: string): Promise<IActiveTicket | null>;

    /**
     * @method findByUser
     * @description Находит все активные тикеты, созданные пользователем.
     * @param {string} userId - ID пользователя.
     * @param {string} guildId - ID гильдии.
     * @returns {Promise<IActiveTicket[]>} Массив активных тикетов пользователя.
     */
    findByUser(userId: string, guildId: string): Promise<IActiveTicket[]>;

    /**
     * @method update
     * @description Обновляет данные существующего тикета.
     * @param {string} channelId - ID канала тикета для обновления.
     * @param {Partial<IActiveTicket>} updates - Объект с обновляемыми полями.
     * @returns {Promise<IActiveTicket>} Обновленный объект тикета.
     */
    update(
        channelId: string,
        updates: Partial<IActiveTicket>
    ): Promise<IActiveTicket>;

    /**
     * @method delete
     * @description Удаляет запись о тикете.
     * @param {string} channelId - ID канала тикета для удаления.
     * @returns {Promise<void>}
     */
    delete(channelId: string): Promise<void>;
}
