/**
 * @file GuildSettings.ts
 * @description Определяет структуру данных для хранения настроек одной гильдии.
 */

import { IPermissionGroup } from "@interface/IPermissionGroup";

/**
 * @interface IGuildSettings
 * @description Структура, описывающая все возможные динамические настройки для одной гильдии.
 */
export interface IGuildSettings {
    logChannelId?: string;
    welcomeChannelId?: string;
    moderationRoleId?: string;
    logChannelMessageDeleteId?: string;
    logChannelMessageEditId?: string;
    logChannelMessageSendId?: string;
    logChannelInteractionId?: string;
    permissionGroups?: Record<string, IPermissionGroup>;
}
