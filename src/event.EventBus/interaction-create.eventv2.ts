/**
 * @file interaction-create.event.ts
 * @description Класс-обертка для события создания любого взаимодействия.
 */
import { Interaction } from "discord.js";

export class InteractionCreateEvent {
    constructor(public readonly interaction: Interaction) {}
}
