/**
 * @file IButtonHandler.ts
 * @description Определяет контракт для всех обработчиков нажатий на кнопки (ButtonInteraction).
 * Каждый обработчик отвечает за логику, связанную с конкретным `customId`.
 * @version 1.0.0
 * @author System
 */

import { ButtonInteraction } from "discord.js";

/**
 * @interface IButtonHandler
 * @description Интерфейс для класса, который обрабатывает нажатие на кнопку с определенным `customId`.
 *
 * @example
 * // Пример обработчика для статического ID
 * @Button()
 * class ConfirmActionHandler implements IButtonHandler {
 *   public readonly customId = 'confirm_action';
 *
 *   public async execute(interaction: ButtonInteraction): Promise<void> {
 *     // ... логика подтверждения
 *   }
 * }
 *
 * @example
 * // Пример обработчика для динамических ID (например, 'delete-item-123')
 * @Button()
 * class DeleteItemHandler implements IButtonHandler {
 *   public readonly customId = /^delete-item-(\d+)$/;
 *
 *   public async execute(interaction: ButtonInteraction): Promise<void> {
 *     const itemId = interaction.customId.match(this.customId)[1];
 *     // ... логика удаления элемента с ID
 *   }
 * }
 */
export interface IButtonHandler {
    /**
     * @property {string | RegExp} customId
     * @description Уникальный идентификатор кнопки, за которую отвечает этот обработчик.
     * - **string:** Для кнопок с фиксированным, статическим ID.
     * - **RegExp:** Для обработки группы кнопок с динамическими ID, соответствующими шаблону.
     *   Например, `/^delete-item-(\d+)$/` будет обрабатывать все кнопки,
     *   ID которых начинается с `delete-item-`.
     */
    readonly customId: string | RegExp;

    /**
     * @method execute
     * @description Основной метод, который выполняется при нажатии на соответствующую кнопку.
     * @param {ButtonInteraction} interaction - Объект взаимодействия, содержащий всю информацию о нажатии.
     * @returns {Promise<void>}
     */
    execute(interaction: ButtonInteraction): Promise<void>;
}
