/**
 * @file guild-config.module.ts
 * @description Модуль для управления командой /config.
 */
import { Module } from "@nestjs/common";
import { CoreModule } from "@core/core.module";
import { ConfigCommand } from "./commands/ConfigCommand";
import { PinnedMessageCommand } from "./commands/PinnedMessageCommand";
import { PinnedMessageValidatorService } from "./services/PinnedMessageValidator";
import { PermissionsModule } from "@permissions/permissions.module";

@Module({
    imports: [CoreModule, PermissionsModule],
    providers: [
        ConfigCommand,
        PinnedMessageCommand,
        PinnedMessageValidatorService
    ],
    exports: [],
})
export class GuildConfigModule {}
