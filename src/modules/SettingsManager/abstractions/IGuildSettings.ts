/**
 * @file IGuildSettings.ts
 * @description Определяет структуру данных для хранения настроек одной гильдии.
 * @version 1.1.0: Добавлена структура для хранения закрепленных сообщений (pinnedMessages).
 * @author System
 */

import { IPermissionGroup } from "@permissions/interfaces/IPermissionGroup";
import { PinnedMessageConfig } from "@type/PinnedMessageConfig";

/**
 * @interface IGuildSettings
 * @description Структура, описывающая все возможные динамические настройки для одной гильдии.
 */
export interface IGuildSettings {
    // Каналы для логирования
    logChannelId?: string;
    logChannelMessageDeleteId?: string;
    logChannelMessageEditId?: string;
    logChannelMessageSendId?: string;
    logChannelInteractionId?: string;
    welcomeChannelId?: string;
    moderationRoleId?: string;
    permissionGroups?: Record<string, IPermissionGroup>;

    // --- НОВАЯ СТРУКТУРА ---
    /**
     * @property {object} [pinnedMessages]
     * @description Объект для хранения информации о "самовосстанавливающихся" сообщениях-панелях.
     * Ключ - тип панели, значение - объект с ID канала и сообщения.
     */
    pinnedMessages?: {
        /**
         * @property {PinnedMessageConfig} [ticketCreatePanel]
         * @description Панель для создания тикетов.
         */
        ticketCreatePanel?: PinnedMessageConfig;

        /**
         * @property {PinnedMessageConfig} [roleSelectPanel]
         * @description Панель для выбора ролей.
         */
        roleSelectPanel?: PinnedMessageConfig;

        // Сюда можно будет добавлять другие типы панелей в будущем
    };
}
export { PinnedMessageConfig };

