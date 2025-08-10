/**
 * @file ICommand.ts
 * @description Определяет структуру для всех слеш-команд бота.
 * ВЕРСИЯ 3.0: Добавлена поддержка AutocompleteInteraction.
 */
import {
    AutocompleteInteraction,
    CommandInteraction,
    SlashCommandBuilder,
    SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export interface ICommand {
    readonly data:
        | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
        | SlashCommandSubcommandsOnlyBuilder;

    /**
     * @method execute
     * @description Основная логика команды, которая выполняется при ее вызове пользователем.
     * @param {CommandInteraction | AutocompleteInteraction} interaction - Объект взаимодействия.
     * @returns {Promise<void>}
     */
    execute(
        interaction: CommandInteraction | AutocompleteInteraction
    ): Promise<void>;
}
