/**
 * @file ITicketSettings.ts
 * @description Определяет структуру настроек модуля тикетов для одной гильдии.
 * @version 2.0.0: Добавлена поддержка маппинга категорий для каждого типа тикета.
 */

import { TicketType } from "../enums/TicketType.enum";

export interface ITicketSettings {
    /**
     * @property categoryMappings
     * @description Объект, сопоставляющий тип тикета с ID категории Discord, в которой он должен быть создан.
     * @example { SUPPORT: "12345...", COMPLAINT: "67890..." }
     */
    categoryMappings: Partial<Record<TicketType, string>>;

    /**
     * @property moderatorRoleIds
     * @description Массив ID ролей, которые имеют права на управление тикетами.
     */
    moderatorRoleIds: string[];

    /**
     * @property maxTicketsPerUser
     * @description Максимальное количество одновременно открытых тикетов для одного пользователя.
     */
    maxTicketsPerUser: number;

    /**
     * @property logChannelId
     * @description Опциональный ID канала для логирования действий с тикетами.
     */
    logChannelId?: string;
}
