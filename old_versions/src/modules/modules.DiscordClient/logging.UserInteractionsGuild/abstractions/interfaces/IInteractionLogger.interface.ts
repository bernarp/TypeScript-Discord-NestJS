/**
 * @file IInteractionLogger.interface.ts
 * @description Интерфейс для логгеров взаимодействий Discord.
 */

import { BaseInteraction, EmbedBuilder } from "discord.js";
import { InteractionCreateEvent } from "@event.EventBus/interaction-create.eventv2";

export interface IInteractionLogger {
    /**
     * @method onInteractionCreated
     * @description Обрабатывает событие создания взаимодействия.
     * @param {InteractionCreateEvent} payload - Данные события.
     * @returns {Promise<void>}
     */
    onInteractionCreated(payload: InteractionCreateEvent): Promise<void>;

    /**
     * @method createLogEmbed
     * @description Создает embed для логирования взаимодействия.
     * @param {BaseInteraction} interaction - Взаимодействие для логирования.
     * @returns {EmbedBuilder}
     */
    createLogEmbed(interaction: BaseInteraction): EmbedBuilder;
}
