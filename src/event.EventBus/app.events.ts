import { Injectable } from "@nestjs/common";

/**
 * @file app.events.ts
 * @description Централизованный реестр всех имен событий в приложении.
 * Использование этого объекта вместо строковых литералов обеспечивает:
 * 1. Защиту от опечаток (TypeScript выдаст ошибку, если имя неверно).
 * 2. Автодополнение в IDE (написав "AppEvents.", вы увидите все доступные события).
 * 3. Централизованную документацию всех событий в одном месте.
 */
export const AppEvents = {
    // --- События, связанные с взаимодействиями ---
    /**
     * @event
     * @description Срабатывает, когда пользователь выполняет любую слеш-команду.
     * @payload {InteractionCreateEvent}
     */
    INTERACTION_CREATED_COMMAND: "interaction.created.command",

    // --- События, связанные с тикетами (пример на будущее) ---
    /**
     * @event
     * @description Срабатывает, когда пользователь создает новый тикет.
     * @payload {TicketCreateEvent} - TODO: Создать этот класс события
     */
    TICKET_CREATED: "ticket.created",

    /**
     * @event
     * @description Срабатывает, когда модератор закрывает тикет.
     * @payload {TicketClosedEvent} - TODO: Создать этот класс события
     */
    TICKET_CLOSED: "ticket.closed",

    // --- События, связанные с модерацией (пример на будущее) ---
    /**
     * @event
     * @description Срабатывает, когда пользователю выдается предупреждение.
     * @payload {UserWarnedEvent} - TODO: Создать этот класс события
     */
    USER_WARNED: "user.warned",

    MESSAGE_CREATED: "message.created",
    MESSAGE_UPDATED: "message.updated",
    MESSAGE_DELETED: "message.deleted",
};
