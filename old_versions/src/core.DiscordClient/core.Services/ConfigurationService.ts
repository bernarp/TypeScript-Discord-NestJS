/**
 * @file ConfigurationService.ts
 * @description Реализация главного фасада для взаимодействия со всеми подсистемами конфигурации.
 * @version 5.1.0 (Corrected)
 * @author System
 */

import { Inject, Injectable } from "@nestjs/common";
import { IConfigurationService } from "@interface/config/IConfigurationService";
import { IEnvRepository } from "@interface/config/repository/IEnvRepository";
import { IGuildSettingsRepository } from "@interface/config/repository/IGuildSettingsRepository";
import { IPermissionRepository } from "@interface/config/repository/IPermissionRepository";
import { ILogger } from "@interface/logger/ILogger";

@Injectable()
export class ConfigurationService implements IConfigurationService {
    public readonly env: IEnvRepository;
    public readonly guilds: IGuildSettingsRepository;
    public readonly permissions: IPermissionRepository;

    constructor(
        @Inject("IEnvRepository")
        envRepository: IEnvRepository,
        @Inject("IGuildSettingsRepository")
        guildSettingsRepository: IGuildSettingsRepository,
        @Inject("IPermissionRepository")
        permissionRepository: IPermissionRepository,
        @Inject("ILogger")
        private readonly _logger: ILogger
    ) {
        this.env = envRepository;
        this.guilds = guildSettingsRepository;
        this.permissions = permissionRepository;

        this._logger.inf("ConfigurationService (Facade) initialized.");
    }

    public async backupAll(backupNamePrefix?: string): Promise<void> {
        this._logger.inf("Starting backup for all configurations...");
        try {
            await this.guilds.backup(backupNamePrefix);
            this._logger.inf(
                "Backup for all configurations completed successfully."
            );
        } catch (error) {
            this._logger.err(
                "Failed to backup all configurations",
                error.stack
            );
            throw error;
        }
    }
}
