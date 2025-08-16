/**
 * @file guild-member-remove.event.ts
 * @description Класс-обертка для события выхода участника с сервера.
 */
// ИЗМЕНЕНИЕ: Импортируем правильные типы
import { GuildMember, PartialGuildMember } from "discord.js";

export class GuildMemberRemoveEvent {
    constructor(public readonly member: GuildMember | PartialGuildMember) {}
}
