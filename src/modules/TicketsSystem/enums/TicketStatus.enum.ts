/**
 * @file TicketStatus.enum.ts
 * @description Определяет возможные жизненные циклы (статусы) тикета.
 */

export enum TicketStatus {
    /**
     * @status OPEN
     * @description Тикет активен и ожидает ответа.
     */
    OPEN = "OPEN",

    /**
     * @status CLOSED
     * @description Тикет закрыт, взаимодействие в нем ограничено. Ожидает архивации или удаления.
     */
    CLOSED = "CLOSED",
}
