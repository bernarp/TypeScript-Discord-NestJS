/**
 * @file app.module.ts
 * @description Корневой модуль приложения NestJS.
 */

import { Module } from "@nestjs/common";
import { Client } from "@core/Client";
import { CoreModule } from "@/core.module";
import { ExampleModule } from "@modules.DiscordClient/example/example.module";
import { HandlersModule as registerModule } from "./handlers.Global/handlers.module";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { LoggingUserInteractionsGuildModule } from "@modules.DiscordClient/logging.UserInteractionsGuild/logging.user-interactions.module";
import { TicketGuildsystemModule } from "@modules.DiscordClient/ticket.GuildSystem/ticket.guildsystem.module";
import { GuildConfigModule } from "./modules/module.GuildConfigManager/config.guild-config-manager.module";
import { PermissionGuard } from "./guards.NestJS/PermissionGuard";
import { APP_GUARD } from "@nestjs/core";

@Module({
    imports: [
        EventEmitterModule.forRoot(),
        CoreModule,
        GuildConfigModule,
        registerModule.register({
            imports: [ExampleModule, GuildConfigModule],
        }),
        LoggingUserInteractionsGuildModule,
        TicketGuildsystemModule,
    ],
    controllers: [],
    providers: [
        Client,
        {
            provide: "IClient",
            useClass: Client,
        },
        {
            provide: APP_GUARD,
            useClass: PermissionGuard,
        },
    ],
})
export class AppModule {}
