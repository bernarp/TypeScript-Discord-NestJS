/**
 * @file createWelcomeTicketEmbed.ts
 * @description Фабрика для создания приветственного embed-сообщения в новом тикете.
 */

import { IEmbedFactory } from "@interfaces/IEmbedFactory";
import { EmbedBuilder, Guild, GuildMember, TextChannel } from "discord.js";

export function createWelcomeTicketEmbed(
    embedFactory: IEmbedFactory,
    member: GuildMember,
    channel: TextChannel
): EmbedBuilder {
    return embedFactory.createInfoEmbed({
        title: `Тикет #${channel.name}`,
        description: `Здравствуйте, ${member.toString()}!\n\nСпасибо за ваше обращение. Пожалуйста, опишите вашу проблему как можно подробнее. Один из модераторов скоро вам ответит.`,
        context: { user: member.user, guild: member.guild },
    });
}