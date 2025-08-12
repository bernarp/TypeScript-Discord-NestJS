/**
 * @file app.module.ts
 * @description Корневой модуль приложения NestJS.
 * @version 2.1: Обновлен импорт CoreModule для асинхронной инициализации.
 */

import { Module } from "@nestjs/common";
import { CoreModule } from "@/core.module";
import { ExampleModule } from "@modules.DiscordClient/example/example.module";
import { HandlersModule as registerModule } from "./handlers.Global/handlers.module";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { LoggingUserInteractionsGuildModule } from "@modules.DiscordClient/logging.UserInteractionsGuild/logging.user-interactions.module";
import { TicketGuildsystemModule } from "@modules.DiscordClient/ticket.GuildSystem/ticket.guildsystem.module";
import { PermissionGuard } from "./guards.NestJS/PermissionGuard";
import { APP_GUARD } from "@nestjs/core";
import { GuildConfigModule } from "./modules/module.GuildConfigManager/config.guild-config-manager.module";
@Module({
    imports: [
        EventEmitterModule.forRoot(),
        CoreModule.forRootAsync(),

        GuildConfigModule,
        ExampleModule,
        LoggingUserInteractionsGuildModule,
        TicketGuildsystemModule,

        registerModule.register({
            imports: [ExampleModule, GuildConfigModule],
        }),
    ],
    controllers: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: PermissionGuard,
        },
    ],
})
export class AppModule {}
