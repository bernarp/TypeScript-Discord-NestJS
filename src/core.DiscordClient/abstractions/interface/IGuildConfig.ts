/**
 * @file IGuildConfig.ts
 * @description Определяет контракт для сервиса управления динамической конфигурацией гильдий.
 * ВЕРСИЯ 3.0: Добавлены методы для управления группами прав.
 */

import { IPermissionGroup } from "./IPermissionGroup";
import { PermissionNode } from "@permissions/permissions.dictionary";

/**
 * @interface IGuildSettings
 * @description Структура, описывающая все возможные настройки для одной гильдии.
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

/**
 * @interface IGuildConfig
 * @description Контракт для сервиса управления конфигурацией.
 */
export interface IGuildConfig {
    // --- Базовые методы ---
    get<T extends IGuildSettings[keyof IGuildSettings]>(
        guildId: string,
        key: keyof IGuildSettings,
        defaultValue?: T
    ): Promise<T | undefined>;
    set(
        guildId: string,
        newSettings: Partial<IGuildSettings>
    ): Promise<IGuildSettings>;
    save(): Promise<void>;
    backup(backupName?: string): Promise<string>;
    getAll(guildId: string): Promise<IGuildSettings | null>;

    // --- Методы для управления правами ---

    /**
     * @method getPermissionGroups
     * @description Получает все группы прав для указанной гильдии.
     */
    getPermissionGroups(
        guildId: string
    ): Promise<Record<string, IPermissionGroup> | undefined>;

    /**
     * @method getPermissionGroup
     * @description Получает одну конкретную группу прав по ее системному имени.
     */
    getPermissionGroup(
        guildId: string,
        groupKey: string
    ): Promise<IPermissionGroup | undefined>;

    /**
     * @method createPermissionGroup
     * @description Создает новую, пустую группу прав.
     */
    createPermissionGroup(
        guildId: string,
        groupKey: string,
        groupName: string
    ): Promise<void>;

    /**
     * @method deletePermissionGroup
     * @description Удаляет существующую группу прав.
     */
    deletePermissionGroup(guildId: string, groupKey: string): Promise<void>;

    /**
     * @method addRoleToGroup
     * @description Добавляет роль Discord в группу прав.
     */
    addRoleToGroup(
        guildId: string,
        groupKey: string,
        roleId: string
    ): Promise<void>;

    /**
     * @method removeRoleFromGroup
     * @description Удаляет роль Discord из группы прав.
     */
    removeRoleFromGroup(
        guildId: string,
        groupKey: string,
        roleId: string
    ): Promise<void>;

    /**
     * @method grantPermissionToGroup
     * @description Предоставляет разрешение (permission node) группе.
     */
    grantPermissionToGroup(
        guildId: string,
        groupKey: string,
        permissionNode: PermissionNode
    ): Promise<void>;

    /**
     * @method revokePermissionFromGroup
     * @description Отзывает разрешение у группы.
     */
    revokePermissionFromGroup(
        guildId: string,
        groupKey: string,
        permissionNode: PermissionNode
    ): Promise<void>;

    /**
     * @method setGroupInheritance
     * @description Устанавливает, от каких групп наследуется данная группа.
     */
    setGroupInheritance(
        guildId: string,
        groupKey: string,
        inheritsFrom: string[]
    ): Promise<void>;
}
