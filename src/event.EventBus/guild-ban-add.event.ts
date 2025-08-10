/**
 * @file guild-ban-add.event.ts
 * @description Класс-обертка для события бана участника.
 */
import { GuildBan } from "discord.js";

export class GuildBanAddEvent {
    constructor(public readonly ban: GuildBan) {}
}
