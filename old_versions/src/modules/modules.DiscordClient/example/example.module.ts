/**
 * @file ExampleModule.ts
 * @description Пример модуля, содержащего сервисы, команды и другие компоненты.
 */

import { Module } from "@nestjs/common";
import { ExampleService } from "./services/ExampleService";
import { HealthModuleCommand } from "./commands/HealthModuleCommand";
import { CoreModule } from "@/core.module";
import { EmitEventCommand } from "./commands/EmitEventCommand";
import { ButtonTestCommand } from "./buttons/ButtonTest";
import { DeleteMessageButtonHandler } from "./buttons/handlers/DeleteMessageButton.handler";

@Module({
    imports: [CoreModule],
    providers: [
        ExampleService,
        HealthModuleCommand,
        EmitEventCommand,
        ButtonTestCommand,
        DeleteMessageButtonHandler,
    ],
    exports: [ExampleService],
})
export class ExampleModule {}
