/**
 * @file IInteractionHandler.ts
 * @description Определяет универсальный контракт для всех обработчиков взаимодействий.
 */
import { Interaction } from "discord.js";

export interface IInteractionHandler {
    /**
     * @method supports
     * @description Проверяет, может ли данный обработчик обработать входящее взаимодействие.
     * @param {Interaction} interaction - Входящее взаимодействие.
     * @returns {boolean} True, если обработчик подходит, иначе false.
     */
    supports(interaction: Interaction): boolean;

    /**
     * @method handle
     * @description Выполняет основную логику обработки взаимодействия.
     * @param {Interaction} interaction - Взаимодействие для обработки.
     * @returns {Promise<void>}
     */
    handle(interaction: Interaction): Promise<void>;
}
