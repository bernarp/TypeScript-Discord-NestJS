/**
 * @file IConfigurationService.ts
 * @description Определяет единый контракт для сервиса конфигурации приложения.
 * Этот интерфейс-фасад предоставляет доступ как к глобальным (статичным) настройкам,
 * так и к динамическим конфигурациям для каждой гильдии.
 */

import { IPermissionGroup } from "./IPermissionGroup";
import { IGuildSettings } from "@type/IGuildSettings";
import { PermissionNode } from "@permissions/permissions.dictionary";

/**
 * @interface IConfigurationService
 * @description Единый сервис для управления всеми видами конфигурации.
 */
export interface IConfigurationService {
    /**
     * @method getGlobal
     * @description Получает значение глобальной конфигурации по ключу (например, из .env файла).
     * @template T - Ожидаемый тип возвращаемого значения.
     * @param {string} key - Ключ параметра (например, 'TOKEN', 'DATABASE_URL').
     * @param {T} [defaultValue] - Опциональное значение по умолчанию.
     * @returns {T} Значение параметра или defaultValue, если ключ не найден.
     */
    getEnv<T>(key: string, defaultValue?: T): T;

    /**
     * @method hasGlobal
     * @description Проверяет наличие глобального ключа в конфигурации.
     * @param {string} key - Ключ для проверки.
     * @returns {boolean} true, если ключ существует, иначе false.
     */
    hasEnv(key: string): boolean;

    // =================================================================
    // --- Методы для работы с настройками гильдий ---
    // =================================================================

    /**
     * @method getGuildSetting
     * @description Получает значение конкретной настройки для указанной гильдии.
     * @template T - Ожидаемый тип возвращаемого значения.
     * @param {string} guildId - ID гильдии.
     * @param {keyof IGuildSettings} key - Ключ настройки (например, 'logChannelId').
     * @param {T} [defaultValue] - Значение по умолчанию.
     * @returns {Promise<T | undefined>} Значение настройки или defaultValue.
     */
    getGuildSetting<T extends IGuildSettings[keyof IGuildSettings]>(
        guildId: string,
        key: keyof IGuildSettings,
        defaultValue?: T
    ): Promise<T | undefined>;

    /**
     * @method setGuildSettings
     * @description Устанавливает или обновляет одну или несколько настроек для гильдии.
     * @param {string} guildId - ID гильдии.
     * @param {Partial<IGuildSettings>} newSettings - Объект с новыми настройками.
     * @returns {Promise<IGuildSettings>} Обновленный полный объект настроек для гильдии.
     */
    setGuildSettings(
        guildId: string,
        newSettings: Partial<IGuildSettings>
    ): Promise<IGuildSettings>;

    /**
     * @method getAllGuildSettings
     * @description Получает полный объект конфигурации для указанной гильдии.
     * @param {string} guildId - ID гильдии.
     * @returns {Promise<IGuildSettings | null>} Объект с настройками или null, если для гильдии нет конфигурации.
     */
    getAllGuildSettings(guildId: string): Promise<IGuildSettings | null>;

    /**
     * @method backup
     * @description Создает резервную копию файла конфигурации гильдий.
     * @param {string} [backupName] - Опциональное имя для файла бэкапа.
     * @returns {Promise<string>} Путь к созданному файлу резервной копии.
     */
    backup(backupName?: string): Promise<string>;

    /**
     * @method getPermissionGroups
     * @description Получает все группы прав для указанной гильдии.
     * @param {string} guildId - ID гильдии.
     * @returns {Promise<Record<string, IPermissionGroup> | undefined>}
     */
    getPermissionGroups(
        guildId: string
    ): Promise<Record<string, IPermissionGroup> | undefined>;

    /**
     * @method getPermissionGroup
     * @description Получает одну конкретную группу прав по ее системному имени.
     * @param {string} guildId - ID гильдии.
     * @param {string} groupKey - Системное имя (ключ) группы.
     * @returns {Promise<IPermissionGroup | undefined>}
     */
    getPermissionGroup(
        guildId: string,
        groupKey: string
    ): Promise<IPermissionGroup | undefined>;

    /**
     * @method createPermissionGroup
     * @description Создает новую, пустую группу прав.
     * @param {string} guildId - ID гильдии.
     * @param {string} groupKey - Системное имя (ключ) для новой группы.
     * @param {string} groupName - Отображаемое имя группы.
     * @returns {Promise<void>}
     */
    createPermissionGroup(
        guildId: string,
        groupKey: string,
        groupName: string
    ): Promise<void>;

    /**
     * @method deletePermissionGroup
     * @description Удаляет существующую группу прав.
     * @param {string} guildId - ID гильдии.
     * @param {string} groupKey - Системное имя (ключ) группы для удаления.
     * @returns {Promise<void>}
     */
    deletePermissionGroup(guildId: string, groupKey: string): Promise<void>;

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
