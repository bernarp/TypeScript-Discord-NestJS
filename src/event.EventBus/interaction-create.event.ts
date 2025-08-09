/**
 * @file interaction-create.event.ts
 * @description Класс-контейнер для данных о событии создания взаимодействия.
 */
import { CommandInteraction } from "discord.js";

export class InteractionCreateEvent {
    /**
     * @constructor
     * @param interaction - Объект взаимодействия, который был создан.
     */
    constructor(public readonly interaction: CommandInteraction) {}
}
