/**
 * @file core.module.ts
 * @description Главный модуль ядра приложения. Регистрирует и экспортирует все ключевые сервисы.
 * @version 5.1.0 (Corrected DI)
 * @author System
 */

import { Global, Module, DynamicModule } from "@nestjs/common";
import { Client } from "./core.DiscordClient/Clientv2";
import { EmbedFactory } from "./utils.Global/EmbedFactory";
import { ErrorLoggerService } from "./core.DiscordClient/error.HandlerFilter/services/ErrorLoggerService";
import { PinnedMessageValidatorService } from "./core.DiscordClient/core.Services/PinnedMessageValidator";
import { ILogger } from "./core.DiscordClient/abstractions/interface/logger/ILogger";

import { IStorageStrategy } from "./core.DiscordClient/abstractions/interface/config/storage/IStorageStrategy";
import { JsonStorageStrategy } from "@core/core.Services/components.ConfigService/storage/JsonStorageStrategy";
import { IEnvRepository } from "./core.DiscordClient/abstractions/interface/config/repository/IEnvRepository";
import { EnvRepository } from "@core/core.Services/components.ConfigService/storage/repository/EnvRepository";
import { IGuildSettingsRepository } from "./core.DiscordClient/abstractions/interface/config/repository/IGuildSettingsRepository";
import { GuildSettingsRepository } from "@core/core.Services/components.ConfigService/storage/repository/GuildSettingsRepository";
import { IPermissionRepository } from "./core.DiscordClient/abstractions/interface/config/repository/IPermissionRepository";
import { PermissionRepository } from "@core/core.Services/components.ConfigService/storage/repository/PermissionRepository";
import { ConfigurationService } from "./core.DiscordClient/core.Services/ConfigurationService";
import { IGuildSettings } from "@type/IGuildSettings";

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
                PinnedMessageValidatorService,
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
