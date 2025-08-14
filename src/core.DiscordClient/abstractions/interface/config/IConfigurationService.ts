/**
 * @file IConfigurationService.ts
 * @description Определяет главный фасад для взаимодействия со всеми подсистемами конфигурации.
 * @version 5.1.0 (Corrected)
 * @author System
 */

import { IEnvRepository } from "./repository/IEnvRepository";
import { IGuildSettingsRepository } from "./repository/IGuildSettingsRepository";
import { IPermissionRepository } from "./repository/IPermissionRepository";

/**
 * @interface IConfigurationService
 * @description Единая точка входа для работы с конфигурацией.
 * Этот интерфейс является фасадом, который предоставляет доступ к специализированным репозиториям.
 * Такой подход (композиция вместо наследования) позволяет избежать коллизий имен и
 * четко разделяет зоны ответственности.
 */
export interface IConfigurationService {
    /**
     * @property env
     * @description Репозиторий для работы с переменными окружения.
     * @example configService.env.getEnv('TOKEN')
     */
    readonly env: IEnvRepository;

    /**
     * @property guilds
     * @description Репозиторий для работы с настройками гильдий.
     * @example configService.guilds.getGuildSettings('guildId')
     */
    readonly guilds: IGuildSettingsRepository;

    /**
     * @property permissions
     * @description Репозиторий для работы с правами доступа.
     * @example configService.permissions.createGroup(...)
     */
    readonly permissions: IPermissionRepository;

    /**
     * @method backupAll
     * @description Создает резервную копию всех конфигурационных данных.
     * @param {string} [backupNamePrefix] - Опциональный префикс для имен файлов бэкапа.
     * @returns {Promise<void>}
     */
    backupAll(backupNamePrefix?: string): Promise<void>;
}
