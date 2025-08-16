/**
 * @file ITicketSettingsRepository.ts
 * @description Контракт для репозитория, управляющего настройками модуля тикетов.
 */

import { ITicketSettings } from "./ITicketSettings";

export interface ITicketSettingsRepository {
    /**
     * @method get
     * @description Получает настройки для указанной гильдии.
     * @param {string} guildId - ID гильдии.
     * @returns {Promise<ITicketSettings | null>} Объект настроек или null, если они не заданы.
     */
    get(guildId: string): Promise<ITicketSettings | null>;

    /**
     * @method set
     * @description Устанавливает или обновляет настройки для указанной гильдии.
     * @param {string} guildId - ID гильдии.
     * @param {Partial<ITicketSettings>} settings - Объект с новыми настройками.
     * @returns {Promise<ITicketSettings>} Полный объект обновленных настроек.
     */
    set(guildId: string, settings: Partial<ITicketSettings>): Promise<ITicketSettings>;
}