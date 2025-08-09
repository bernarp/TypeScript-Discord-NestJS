import { CommandInteraction, _Omit, SlashCommandBuilder } from "discord.js";

/**
 * @interface ICommand
 * @description Определяет структуру для всех слеш-команд бота.
 * Каждая команда должна реализовывать этот интерфейс, чтобы быть корректно
 * зарегистрированной и обработанной.
 */
export interface ICommand {
    /**
     * @property data
     * @description Конфигурация команды, созданная с помощью SlashCommandBuilder.
     * Содержит имя, описание, параметры и другие метаданные команды.
     * Используется Omit для исключения методов построения подкоманд,
     * так как на этом уровне ожидается уже сконфигурированный объект.
     */
    readonly data: Omit<
        SlashCommandBuilder,
        "addSubcommand" | "addSubcommandGroup"
    >;

    /**
     * @method execute
     * @description Основная логика команды, которая выполняется при ее вызове пользователем.
     * @param {CommandInteraction} interaction - Объект взаимодействия, содержащий всю информацию о вызове команды.
     * @returns {Promise<void>} Promise, который разрешается после завершения выполнения команды.
     */
    execute(interaction: CommandInteraction): Promise<void>;
}
