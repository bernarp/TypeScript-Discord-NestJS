import { Module, DynamicModule } from "@nestjs/common";
import { CoreModule } from "@/core.module";
import { ExampleModule } from "@modules.DiscordClient/example/example.module";
import { HandlersModule as registerModule } from "./handlers.Global/handlers.module";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { LoggingUserInteractionsGuildModule } from "@modules.DiscordClient/logging.UserInteractionsGuild/logging.user-interactions.module";
import { TicketGuildsystemModule } from "@modules.DiscordClient/ticket.GuildSystem/ticket.guildsystem.module";
import { PermissionGuard } from "./guards.NestJS/PermissionGuard";
import { APP_GUARD } from "@nestjs/core";
import { GuildConfigModule } from "./modules/module.GuildConfigManager/config.guild-config-manager.module";
import { ILogger } from "@interface/logger/ILogger";

@Module({})
export class AppModule {
    static register(logger: ILogger): DynamicModule {
        return {
            module: AppModule,
            imports: [
                EventEmitterModule.forRoot(),
                CoreModule.forRootAsync(logger),
                GuildConfigModule,
                ExampleModule,
                LoggingUserInteractionsGuildModule,
                TicketGuildsystemModule,
                registerModule.register({
                    imports: [ExampleModule, GuildConfigModule],
                }),
            ],
            providers: [
                {
                    provide: APP_GUARD,
                    useClass: PermissionGuard,
                },
                {
                    provide: "ILogger",
                    useValue: logger,
                },
            ],
        };
    }
}
