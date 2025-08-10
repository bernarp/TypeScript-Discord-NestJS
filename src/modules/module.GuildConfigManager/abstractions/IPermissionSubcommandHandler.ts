/**
 * @file IPermissionSubcommandHandler.ts
 * @description Определяет контракт для обработчиков подкоманд управления правами.
 */
import { ChatInputCommandInteraction } from "discord.js";

export interface IPermissionSubcommandHandler {
    /**
     * @method execute
     * @description Выполняет логику конкретной подкоманды.
     * @param {ChatInputCommandInteraction} interaction - Взаимодействие, инициировавшее команду.
     * @returns {Promise<void>}
     */
    execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
