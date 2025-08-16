/**
 * @file createTicketPanelComponents.ts
 * @description Фабрика для создания компонентов (кнопок) для панели тикетов.
 */

import { CustomIds } from "@enums/CustomIds.enum";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export function createTicketPanelComponents(): ActionRowBuilder<ButtonBuilder> {
    const createButton = new ButtonBuilder()
        .setCustomId(CustomIds.CREATE_TICKET_BUTTON)
        .setLabel("Создать тикет")
        .setStyle(ButtonStyle.Success)
        .setEmoji("📩");

    return new ActionRowBuilder<ButtonBuilder>().addComponents(createButton);
}
