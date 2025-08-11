/**
 * @file interaction-create.event.ts
 * @description Класс-обертка для события создания взаимодействия.
 * ВЕРСИЯ 2.0: Добавлен дженерик для строгой типизации.
 */
import { Interaction } from "discord.js";

export class InteractionCreateEvent<T extends Interaction = Interaction> {
    constructor(public readonly interaction: T) {}
}
