/**
 * @file IConfigurationService.ts
 * @description Определяет единый контракт для сервиса конфигурации приложения.
 * @version 1.2.0: Добавлен метод для удаления Pinned Message.
 * @author System
 */

import { IPermissionGroup } from "./IPermissionGroup";
import { IGuildSettings, PinnedMessageConfig } from "@type/IGuildSettings";
import { PermissionNode } from "@permissions/permissions.dictionary";

/**
 * @interface IConfigurationService
 * @description Единый сервис для управления всеми видами конфигурации:
 * глобальными переменными окружения, динамическими настройками гильдий и системой прав доступа.
 */
export interface IConfigurationService {
    /**
     * @method getEnv
     * @description Получает значение глобальной конфигурации по ключу (например, из .env файла).
     * @template T - Ожидаемый тип возвращаемого значения.
     * @param {string} key - Ключ параметра (например, 'TOKEN', 'DATABASE_URL').
     * @param {T} [defaultValue] - Опциональное значение по умолчанию.
     * @returns {T} Значение параметра или defaultValue, если ключ не найден.
     * @throws {Error} Если ключ не найден и defaultValue не предоставлен.
     */
    getEnv<T>(key: string, defaultValue?: T): T;

    /**
     * @method hasEnv
     * @description Проверяет наличие глобального ключа в конфигурации.
     * @param {string} key - Ключ для проверки.
     * @returns {boolean} true, если ключ существует, иначе false.
     */
    hasEnv(key: string): boolean;

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
     * @method getAllGuildConfigs
     * @description Возвращает кэшированные конфигурации всех гильдий.
     * @returns {Promise<[string, IGuildSettings][]>} Массив кортежей [guildId, settings].
     */
    getAllGuildConfigs(): Promise<[string, IGuildSettings][]>;

    /**
     * @method setPinnedMessage
     * @description Сохраняет или обновляет информацию о закрепленном сообщении для гильдии.
     * @param {string} guildId - ID гильдии.
     * @param {keyof Required<IGuildSettings>['pinnedMessages']} type - Тип сообщения (например, 'ticketCreatePanel').
     * @param {PinnedMessageConfig} config - Объект с ID канала и сообщения.
     * @returns {Promise<void>}
     */
    setPinnedMessage(
        guildId: string,
        type: keyof Required<IGuildSettings>["pinnedMessages"],
        config: PinnedMessageConfig
    ): Promise<void>;

    /**
     * @method deletePinnedMessage
     * @description Удаляет информацию о закрепленном сообщении из конфигурации гильдии.
     * @param {string} guildId - ID гильдии.
     * @param {keyof Required<IGuildSettings>['pinnedMessages']} type - Тип сообщения для удаления.
     * @returns {Promise<void>}
     */
    deletePinnedMessage(
        guildId: string,
        type: keyof Required<IGuildSettings>["pinnedMessages"]
    ): Promise<void>;

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
