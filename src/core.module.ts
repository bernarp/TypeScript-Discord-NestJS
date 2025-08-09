/**
 * @file core.module.ts
 * @description Модуль, предоставляющий фундаментальные сервисы для всего приложения.
 * Декоратор @Global() делает экспортируемые провайдеры доступными во всех модулях.
 */
import { Global, Module } from "@nestjs/common";
import { ConfigManager } from "@core/ConfigManager";
import { Client } from "@core/Client";
import { EmbedFactory } from "./utils.Global/EmbedFactory";
import { ErrorLoggerService } from "@err/services/ErrorLoggerService";
import { GuildConfigManager } from "./core.DiscordClient/GuildConfigManager";
import { APP_INTERCEPTOR } from "@nestjs/core";

@Global()
@Module({
    providers: [
        {
            provide: "IConfig",
            useClass: ConfigManager,
        },
        {
            provide: "IClient",
            useClass: Client,
        },
        {
            provide: "IEmbedFactory",
            useClass: EmbedFactory,
        },
        {
            provide: "IGuildConfig",
            useClass: GuildConfigManager,
        },
        ErrorLoggerService,
    ],
    exports: [
        "IConfig",
        "IClient",
        "IEmbedFactory",
        ErrorLoggerService,
        "IGuildConfig",
    ],
})
export class CoreModule {}
