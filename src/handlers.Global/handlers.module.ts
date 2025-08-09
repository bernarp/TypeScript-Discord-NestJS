/**
 * @file handlers.module.ts
 * @description Динамический модуль для регистрации обработчиков команд.
 */
import { DynamicModule, Module } from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";
import { CommandHandlerService } from "./CommandManager";

@Module({})
export class HandlersModule {
    /**
     * @description Конфигурирует модуль, импортируя модули, которые предоставляют команды.
     */
    public static register(options: { imports: any[] }): DynamicModule {
        return {
            module: HandlersModule,
            imports: [DiscoveryModule, ...options.imports],
            providers: [CommandHandlerService],
            exports: [CommandHandlerService],
        };
    }
}
