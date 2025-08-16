/**
 * @file TicketType.enum.ts
 * @description Определяет категории (типы) тикетов для их логического разделения.
 */

export enum TicketType {
    /**
     * @type SUPPORT
     * @description Тикет для получения технической поддержки или помощи.
     */
    SUPPORT = "SUPPORT",

    /**
     * @type COMPLAINT
     * @description Тикет-жалоба на пользователя или ситуацию.
     */
    COMPLAINT = "COMPLAINT",

    /**
     * @type QUESTION
     * @description Тикет для общих вопросов, не связанных с технической поддержкой.
     */
    QUESTION = "QUESTION",

    /**
     * @type OTHER
     * @description Тикет для прочих вопросов, не подходящих под другие категории.
     */
    OTHER = "OTHER",
}
