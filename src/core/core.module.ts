/**
 * @file core.module.ts
 * @description Главный модуль ядра приложения. Регистрирует и экспортирует все ключевые сервисы.
 * @version 5.1.0 (Corrected DI)
 * @author System
 */

import { Global, Module, DynamicModule } from "@nestjs/common";
import { Client } from "@core/client/Clientv2";
import { EmbedFactory } from "@utils/embed/EmbedFactory";
import { ErrorLoggerService } from "@error-handling/error-logger.service";
import { PinnedMessageValidatorService } from "@/modules/SettingsManager/services/PinnedMessageValidator";
import { ILogger } from "@logger";

import { IStorageStrategy } from "@config/storage/IStorageStrategy";
import { JsonStorageStrategy } from "@config/storage/JsonStorageStrategy";
import { IEnvRepository } from "@config/interfaces/IEnvRepository";
import { EnvRepository } from "@config/repositories/EnvRepository";
import { IGuildSettingsRepository } from "@config/interfaces/IGuildSettingsRepository";
import { GuildSettingsRepository } from "@config/repositories/GuildSettingsRepository";
import { IPermissionRepository } from "@config/interfaces/IPermissionRepository";
import { PermissionRepository } from "@config/repositories/PermissionRepository";
import { ConfigurationService } from "@/modules/SettingsManager/services/ConfigurationService";
import { IGuildSettings } from "@settings/abstractions/IGuildSettings";

@Global()
@Module({})
export class CoreModule {
    static forRootAsync(logger: ILogger): DynamicModule {
        const guildConfigStorageProvider = {
            provide: "GuildConfigStorageStrategy",
            useFactory: (logger: ILogger) => {
                return new JsonStorageStrategy<Map<string, IGuildSettings>>(
                    "guild-configs.json",
                    logger,
                    () => new Map()
                );
            },
            inject: ["ILogger"],
        };

        const envRepositoryProvider = {
            provide: "IEnvRepository",
            useFactory: (logger: ILogger) => new EnvRepository(logger),
            inject: ["ILogger"],
        };

        const guildSettingsRepositoryProvider = {
            provide: "IGuildSettingsRepository",
            useFactory: async (
                storage: IStorageStrategy<Map<string, IGuildSettings>>,
                logger: ILogger
            ) => {
                const repo = new GuildSettingsRepository(storage, logger);
                await repo.init();
                return repo;
            },
            inject: ["GuildConfigStorageStrategy", "ILogger"],
        };

        const permissionRepositoryProvider = {
            provide: "IPermissionRepository",
            useFactory: (
                guildsRepo: IGuildSettingsRepository,
                logger: ILogger
            ) => {
                return new PermissionRepository(guildsRepo, logger);
            },
            inject: ["IGuildSettingsRepository", "ILogger"],
        };

        const configServiceProvider = {
            provide: "IConfigurationService",
            useFactory: (
                envRepo: IEnvRepository,
                guildsRepo: IGuildSettingsRepository,
                permsRepo: IPermissionRepository,
                logger: ILogger
            ) => {
                return new ConfigurationService(
                    envRepo,
                    guildsRepo,
                    permsRepo,
                    logger
                );
            },
            inject: [
                "IEnvRepository",
                "IGuildSettingsRepository",
                "IPermissionRepository",
                "ILogger",
            ],
        };

        return {
            module: CoreModule,
            providers: [
                { provide: "ILogger", useValue: logger },
                guildConfigStorageProvider,
                envRepositoryProvider,
                guildSettingsRepositoryProvider,
                permissionRepositoryProvider,
                configServiceProvider,
                { provide: "IClient", useClass: Client },
                { provide: "IEmbedFactory", useClass: EmbedFactory },
                ErrorLoggerService,
            ],
            exports: [
                "IConfigurationService",
                "IPermissionRepository",
                "IClient",
                "IEmbedFactory",
                "ILogger",
                ErrorLoggerService,
            ],
        };
    }
}
