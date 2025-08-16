/**
 * @file createTicketPanelEmbed.ts
 * @description Фабрика для создания embed-сообщения панели тикетов.
 */

import { IEmbedFactory } from "@interfaces/IEmbedFactory";
import { EmbedBuilder } from "discord.js";

export function createTicketPanelEmbed(embedFactory: IEmbedFactory): EmbedBuilder {
    return embedFactory.createInfoEmbed({
        title: "Центр поддержки",
        description:
            "Добро пожаловать в центр поддержки!\n\n" +
            "Если у вас возник вопрос, жалоба или вам требуется помощь, пожалуйста, нажмите на кнопку ниже, чтобы создать тикет. " +
            "Наша команда модераторов постарается ответить вам как можно скорее.",
    });
}