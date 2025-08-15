/**
 * @file handlers.module.ts
 * @description Модуль, регистрирующий диспетчер взаимодействий и его компоненты.
 */
import { DynamicModule, Module } from "@nestjs/common";
import { InteractionManager } from "./InteractionManager";
import { CommandHandler } from "./components.DiscordInteractions/Command.handler";
import { DiscoveryModule } from "@nestjs/core";
import { ButtonManager } from "./components.DiscordInteractions/Button.handler";

@Module({
    imports: [DiscoveryModule],
})
export class HandlersModule {
    static register(options: { imports: any[] }): DynamicModule {
        return {
            module: HandlersModule,
            imports: [...options.imports],
            providers: [InteractionManager, CommandHandler, ButtonManager],
            exports: [],
        };
    }
}
