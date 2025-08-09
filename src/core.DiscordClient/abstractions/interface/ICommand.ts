/**
 * @file ICommand.ts
 * @description Определяет структуру для всех слеш-команд бота.
 * ВЕРСИЯ 2.0: Добавлена поддержка команд с подкомандами.
 */
import {
    CommandInteraction,
    SlashCommandBuilder,
    SlashCommandSubcommandsOnlyBuilder, // Импортируем тип для билдера с подкомандами
} from "discord.js";

export interface ICommand {
    /**
     * @property data
     * @description Конфигурация команды.
     * ИЗМЕНЕНИЕ: Теперь `data` может быть одним из двух типов:
     * 1. Обычный SlashCommandBuilder (без подкоманд).
     * 2. SlashCommandSubcommandsOnlyBuilder (когда вы используете .addSubcommand()).
     * Это делает интерфейс универсальным для всех видов команд.
     */
    readonly data:
        | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
        | SlashCommandSubcommandsOnlyBuilder;

    /**
     * @method execute
     * @description Основная логика команды, которая выполняется при ее вызове пользователем.
     * @param {CommandInteraction} interaction - Объект взаимодействия, содержащий всю информацию о вызове команды.
     * @returns {Promise<void>}
     */
    execute(interaction: CommandInteraction): Promise<void>;
}
