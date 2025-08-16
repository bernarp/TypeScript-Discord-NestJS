/**
 * @file createTicketClosedEmbed.ts
 * @description Фабрика для создания embed-сообщения о закрытии тикета.
 */

import { IEmbedFactory } from "@interfaces/IEmbedFactory";
import { EmbedBuilder, GuildMember } from "discord.js";

export function createTicketClosedEmbed(
    embedFactory: IEmbedFactory,
    member: GuildMember
): EmbedBuilder {
    return embedFactory.createErrorEmbed({
        title: "Тикет закрыт",
        description: `Тикет был закрыт пользователем ${member.toString()}.`,
        context: { user: member.user, guild: member.guild },
    });
}
