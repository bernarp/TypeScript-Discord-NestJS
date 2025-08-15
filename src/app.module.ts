import { Module, DynamicModule } from "@nestjs/common";
import { CoreModule } from "@core/core.module";
import { ExampleModule } from "@example/example.module";
import { HandlersModule as registerModule } from "@interactions/handlers.module";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { LoggingUserInteractionsGuildModule } from "@guild-logging/logging.user-interactions.module";
import { TicketGuildsystemModule } from "@tickets/ticket.guildsystem.module";
import { PermissionGuard } from "@guards/PermissionGuard";
import { APP_GUARD } from "@nestjs/core";
import { GuildConfigModule } from "@settings/config.guild-config-manager.module";
import { ILogger } from "@logger";

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
