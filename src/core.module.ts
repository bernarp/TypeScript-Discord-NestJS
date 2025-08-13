import { Global, Module, DynamicModule } from "@nestjs/common";
import { Client } from "./core.DiscordClient/Clientv2";
import { EmbedFactory } from "./utils.Global/EmbedFactory";
import { ErrorLoggerService } from "./core.DiscordClient/error.HandlerFilter/services/ErrorLoggerService";
import { ConfigurationService } from "@core/core.Services/ConfigurationService";
import { ILogger } from "./core.DiscordClient/abstractions/interface/logger/ILogger";
import { PinnedMessageValidatorService } from "./core.DiscordClient/core.Services/PinnedMessageValidator";

@Global()
@Module({})
export class CoreModule {
    static forRootAsync(logger: ILogger): DynamicModule {
        const configProvider = {
            provide: "IConfigurationService",
            useFactory: async (logger: ILogger) => {
                const service = new ConfigurationService(logger);
                await service.init();
                return service;
            },
            inject: ["ILogger"],
        };

        return {
            module: CoreModule,
            providers: [
                {
                    provide: "ILogger",
                    useValue: logger,
                },
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
                PinnedMessageValidatorService,
            ],
            exports: [
                "IConfigurationService",
                "IClient",
                "IEmbedFactory",
                "ILogger",
                ErrorLoggerService,
            ],
        };
    }
}
