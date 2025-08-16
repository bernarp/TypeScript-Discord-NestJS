/**
 * @file createTicketActionRow.ts
 * @description Фабрика для создания компонентов (кнопок) внутри активного тикета.
 */

import { CustomIds } from "@enums/CustomIds.enum";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    TextChannel,
} from "discord.js";

export function createTicketActionRow(
    channel: TextChannel
): ActionRowBuilder<ButtonBuilder> {
    const closeButton = new ButtonBuilder()
        .setCustomId(`${CustomIds.TICKET_ACTION_PREFIX}close_${channel.id}`)
        .setLabel("Закрыть тикет")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🔒");

    return new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton);
}
