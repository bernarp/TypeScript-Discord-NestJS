/**
 * @file guild-member-add.event.ts
 * @description Класс-обертка для события входа участника на сервер.
 */
import { GuildMember } from "discord.js";

export class GuildMemberAddEvent {
    constructor(public readonly member: GuildMember) {}
}
