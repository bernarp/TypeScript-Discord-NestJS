/**
 * @file IPermissionRepository.ts
 * @description Определяет контракт для репозитория, управляющего системой прав доступа.
 * @version 1.0.0
 * @author System
 */

import { IPermissionGroup } from "@permissions/interfaces/IPermissionGroup";
import { PermissionNode } from "@permissions/permissions.dictionary";

/**
 * @interface IPermissionRepository
 * @description Контракт для управления "сырыми" данными о правах доступа: группами, их ролями,
 * разрешениями и наследованием. Заменяет собой GuildPermissionsManager.
 */
export interface IPermissionRepository {
    /**
     * @method getGroup
     * @description Получает одну конкретную группу прав по ее системному имени.
     * @param {string} guildId - ID гильдии.
     * @param {string} groupKey - Системное имя (ключ) группы.
     * @returns {Promise<IPermissionGroup | undefined>}
     */
    getGroup(
        guildId: string,
        groupKey: string
    ): Promise<IPermissionGroup | undefined>;

    /**
     * @method getAllGroups
     * @description Получает все группы прав для указанной гильдии.
     * @param {string} guildId - ID гильдии.
     * @returns {Promise<Record<string, IPermissionGroup> | undefined>}
     */
    getAllGroups(
        guildId: string
    ): Promise<Record<string, IPermissionGroup> | undefined>;

    /**
     * @method createGroup
     * @description Создает новую, пустую группу прав.
     * @param {string} guildId - ID гильдии.
     * @param {string} groupKey - Системное имя (ключ) для новой группы.
     * @param {string} groupName - Отображаемое имя группы.
     * @returns {Promise<void>}
     */
    createGroup(
        guildId: string,
        groupKey: string,
        groupName: string
    ): Promise<void>;

    /**
     * @method deleteGroup
     * @description Удаляет существующую группу прав.
     * @param {string} guildId - ID гильдии.
     * @param {string} groupKey - Системное имя (ключ) группы для удаления.
     * @returns {Promise<void>}
     */
    deleteGroup(guildId: string, groupKey: string): Promise<void>;

    /**
     * @method addRoleToGroup
     * @description Добавляет роль Discord в группу прав.
     * @param {string} guildId - ID гильдии.
     * @param {string} groupKey - Ключ группы.
     * @param {string} roleId - ID роли Discord.
     * @returns {Promise<void>}
     */
    addRoleToGroup(
        guildId: string,
        groupKey: string,
        roleId: string
    ): Promise<void>;

    /**
     * @method removeRoleFromGroup
     * @description Удаляет роль Discord из группы прав.
     * @param {string} guildId - ID гильдии.
     * @param {string} groupKey - Ключ группы.
     * @param {string} roleId - ID роли Discord.
     * @returns {Promise<void>}
     */
    removeRoleFromGroup(
        guildId: string,
        groupKey: string,
        roleId: string
    ): Promise<void>;

    /**
     * @method grantPermissionToGroup
     * @description Предоставляет разрешение (permission node) группе.
     * @param {string} guildId - ID гильдии.
     * @param {string} groupKey - Ключ группы.
     * @param {PermissionNode} permissionNode - Узел разрешения.
     * @returns {Promise<void>}
     */
    grantPermissionToGroup(
        guildId: string,
        groupKey: string,
        permissionNode: PermissionNode
    ): Promise<void>;

    /**
     * @method revokePermissionFromGroup
     * @description Отзывает разрешение у группы.
     * @param {string} guildId - ID гильдии.
     * @param {string} groupKey - Ключ группы.
     * @param {PermissionNode} permissionNode - Узел разрешения.
     * @returns {Promise<void>}
     */
    revokePermissionFromGroup(
        guildId: string,
        groupKey: string,
        permissionNode: PermissionNode
    ): Promise<void>;

    /**
     * @method setGroupInheritance
     * @description Устанавливает, от каких групп наследуется данная группа.
     * @param {string} guildId - ID гильдии.
     * @param {string} groupKey - Ключ настраиваемой группы.
     * @param {string[]} inheritsFrom - Массив ключей родительских групп.
     * @returns {Promise<void>}
     */
    setGroupInheritance(
        guildId: string,
        groupKey: string,
        inheritsFrom: string[]
    ): Promise<void>;
}
