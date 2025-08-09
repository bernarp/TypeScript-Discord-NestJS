/**
 * @file IGuildConfig.ts
 * @description Определяет контракт для сервиса управления динамической конфигурацией гильдий.
 */

/**
 * @interface GuildSettings
 * @description Структура, описывающая все возможные настройки для одной гильдии.
 */
export interface IGuildSettings {
    logChannelId?: string;
    welcomeChannelId?: string;
    moderationRoleId?: string;
    // ... другие возможные настройки
}

/**
 * @interface IGuildConfig
 * @description Контракт для сервиса управления конфигурацией.
 */
export interface IGuildConfig {
    /**
     * @method get
     * @description
     * Использование дженерика <T> позволяет получать типизированные значения.
     * @template T - Ожидаемый тип возвращаемого значения (например, string, number, boolean).
     * @param {string} guildId - ID гильдии, для которой запрашивается настройка.
     * @param {keyof IGuildSettings} key - Ключ настройки, которую нужно получить (например, 'logChannelId').
     *        Использование `keyof GuildSettings` обеспечивает строгую типизацию и автодополнение ключей.
     * @param {T} [defaultValue] - Опциональное значение, которое будет возвращено, если настройка для гильдии или конкретный ключ не найдены.
     * @returns {Promise<T | undefined>} Значение настройки или defaultValue. Возвращает undefined, если настройка не найдена и defaultValue не предоставлен.
     */
    get<T extends IGuildSettings[keyof IGuildSettings]>(
        guildId: string,
        key: keyof IGuildSettings,
        defaultValue?: T
    ): Promise<T | undefined>;

    /**
     * @method set
     * @description Устанавливает (обновляет) одну или несколько настроек для указанной гильдии.
     * @param {string} guildId - ID гильдии, для которой устанавливаются настройки.
     * @param {Partial<IGuildSettings>} newSettings - Объект с настройками, которые нужно изменить.
     * @returns {Promise<IGuildSettings>} Обновленный полный объект настроек для гильдии.
     */
    set(
        guildId: string,
        newSettings: Partial<IGuildSettings>
    ): Promise<IGuildSettings>;

    /**
     * @method save
     * @description Принудительно сохраняет все конфигурации из кэша в постоянное хранилище.
     * @returns {Promise<void>}
     */
    save(): Promise<void>;

    /**
     * @method backup
     * @description Создает резервную копию текущего файла конфигурации.
     * @param {string} [backupName] - Опциональное имя для файла бэкапа.
     * @returns {Promise<string>} Путь к созданному файлу резервной копии.
     */
    backup(backupName?: string): Promise<string>;

    /**
     * @method getAll
     * @description Запрашивает ПОЛНУЮ конфигурацию для указанной гильдии.
     * Этот метод добавлен, так как `get` теперь запрашивает только одно поле.
     * @param {string} guildId - ID гильдии.
     * @returns {Promise<IGuildSettings | null>} Объект с настройками или null.
     */
    getAll(guildId: string): Promise<IGuildSettings | null>;
}
