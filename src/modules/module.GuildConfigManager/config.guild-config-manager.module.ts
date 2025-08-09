/**
 * @file guild-config.module.ts
 * @description Модуль для управления командой /config.
 */
import { Module } from "@nestjs/common";
import { CoreModule } from "@/core.module";
import { ConfigCommand } from "./commands/ConfigCommand";

@Module({
    imports: [CoreModule],
    providers: [ConfigCommand],
    exports: []
})
export class GuildConfigModule {}
