/**
 * @file core.module.ts
 * @description Динамический модуль, предоставляющий фундаментальные, глобальные сервисы.
 * @version 3.0: Переход на асинхронную фабрику для ConfigurationService.
 */
import { Global, Module, DynamicModule } from "@nestjs/common";
import { Client } from "./core.DiscordClient/Clientv2";
import { EmbedFactory } from "./utils.Global/EmbedFactory";
import { ErrorLoggerService } from "./core.DiscordClient/error.HandlerFilter/services/ErrorLoggerService";
import { ConfigurationService } from "./core.DiscordClient/ConfigurationService";

@Global()
@Module({})
export class CoreModule {
    static forRootAsync(): DynamicModule {
        const configProvider = {
            provide: "IConfigurationService",
            useFactory: async () => {
                const service = new ConfigurationService();
                await service.init();
                return service;
            },
        };

        return {
            module: CoreModule,
            providers: [
                configProvider,
                {
                    provide: "IClient",
                    useClass: Client,
                },
                {
                    provide: "IEmbedFactory",
                    useClass: EmbedFactory,
                },
                ErrorLoggerService,
            ],
            exports: [
                "IConfigurationService",
                "IClient",
                "IEmbedFactory",
                ErrorLoggerService,
            ],
        };
    }
}
