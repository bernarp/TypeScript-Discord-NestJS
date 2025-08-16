// src/core.DiscordClient/abstractions/enums/CustomIds.enum.ts

/**
 * @file CustomIds.enum.ts
 * @description Централизованный справочник всех `customId` для интерактивных компонентов.
 * @version 1.1.0: Добавлена поддержка динамических ID для кнопок подтверждения.
 * @author System
 */

export const CustomIds = {
    /**
     * @id delete_test_message
     * @description Кнопка для удаления тестового сообщения, отправляемого командой /button-test.
     * @handler DeleteMessageButtonHandler
     */
    DELETE_TEST_MESSAGE_BUTTON: "delete_test_message",

    /**
     * @id_prefix confirm_action_
     * @description Префикс для всех кнопок, требующих подтверждения действия.
     * @pattern confirm_action_{actionType}_{targetId}
     * @example 'confirm_action_delete-user_123456789'
     */
    CONFIRM_ACTION_PREFIX: "confirm_action_",

    /**
     * @id cancel_action
     * @description Общая кнопка для отмены какого-либо действия. Часто используется вместе с кнопкой подтверждения.
     * @handler CancelActionButtonHandler (предполагается, что он просто удаляет сообщение)
     */
    CANCEL_ACTION_BUTTON: "cancel_action",

     /**
     * @id_pattern ticket_action_{action}_{ticketId}
     * @description Префикс для кнопок, связанных с действиями над тикетами.
     * @example 'ticket_action_close_12345'
     */
    TICKET_ACTION_PREFIX: "ticket_action_",

    /**
     * @id create_ticket_button
     * @description Кнопка на панели для создания нового тикета.
     * @handler CreateTicketButtonHandler
     */
    CREATE_TICKET_BUTTON: "create_ticket_button",

    /**
     * @id create_ticket_modal
     * @description Модальное окно, запрашивающее тип тикета перед созданием.
     */
    CREATE_TICKET_MODAL: "create_ticket_modal",

    /**
     * @id create_ticket_type_select
     * @description Выпадающее меню внутри модального окна для выбора типа тикета.
     */
    CREATE_TICKET_TYPE_SELECT: "create_ticket_type_select",
} as const;

/**
 * @type CustomId
 * @description Утилитарный тип, представляющий собой объединение всех возможных статических `customId`.
 */
export type CustomId = (typeof CustomIds)[keyof typeof CustomIds];

/**
 * Регулярное выражение для парсинга `customId` кнопок подтверждения.
 * Захватывает (1) тип действия и (2) ID цели.
 * @example 'confirm_action_delete-user_12345' -> ['delete-user', '12345']
 */
export const CONFIRM_ACTION_REGEX = new RegExp(
    `^${CustomIds.CONFIRM_ACTION_PREFIX}([\\w-]+)_([\\w-]+)$`
);

/**
 * Создает `customId` для кнопки подтверждения.
 * @param {string} actionType - Тип действия (например, 'delete-user', 'close-ticket'). Должен быть уникальной строкой.
 * @param {string} targetId - Уникальный идентификатор цели (ID пользователя, ID тикета и т.д.).
 * @returns {string} Сгенерированный `customId`.
 */
export function createConfirmationId(
    actionType: string,
    targetId: string
): string {
    const customId = `${CustomIds.CONFIRM_ACTION_PREFIX}${actionType}_${targetId}`;
    if (customId.length > 100) {
        console.warn(`Generated customId exceeds 100 characters: ${customId}`);
    }
    return customId;
}
