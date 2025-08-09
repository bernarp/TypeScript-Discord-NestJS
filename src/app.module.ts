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
import { LoggingUserCreateInteractionsGuildModule } from "./modules/modules.DiscordClient/logging.UserCreateInteractionsGuild/logging.user.create-interactions.module";

@Module({
    imports: [
        CoreModule,
        registerModule.register({
            imports: [ExampleModule],
        }),
        EventEmitterModule.forRoot(),
        LoggingUserCreateInteractionsGuildModule,
    ],
    controllers: [],
    providers: [
        Client,
        {
            provide: "IClient",
            useClass: Client,
        },
    ],
})
export class AppModule {}
