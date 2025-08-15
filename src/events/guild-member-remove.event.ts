/**
 * @file guild-member-remove.event.ts
 * @description Класс-обертка для события выхода участника с сервера.
 */
import { GuildMember, PartialGuildMember } from "discord.js";

export class GuildMemberRemoveEvent {
    constructor(public readonly member: GuildMember | PartialGuildMember) {}
}

