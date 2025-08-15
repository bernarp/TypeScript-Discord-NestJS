/**
 * @file guild-ban-remove.event.ts
 * @description Класс-обертка для события разбана участника.
 */
import { GuildBan } from "discord.js";

export class GuildBanRemoveEvent {
    constructor(public readonly ban: GuildBan) {}
}
