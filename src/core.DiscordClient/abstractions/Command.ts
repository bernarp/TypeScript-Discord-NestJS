/**
 * @file Command.ts
 * @description Содержит абстрактный базовый класс для всех слеш-команд.
 */

import { CommandInteraction, SlashCommandBuilder, _Omit } from "discord.js";
import { ICommand } from "./interface/ICommand";

/**
 * @abstract
 * @class Command
 * @description Базовый абстрактный класс, реализующий интерфейс ICommand.
 * Он определяет общую структуру для всех команд и заставляет дочерние классы
 * реализовывать ключевые свойства и методы.
 * @implements {ICommand}
 */
export abstract class Command implements ICommand {
    /**
     * @public
     * @abstract
     * @readonly
     * @property data
     * @description Конфигурация команды для Discord API. Должна быть реализована
     * в каждом конкретном классе команды.
     */
    public abstract readonly data: Omit<
        SlashCommandBuilder,
        "addSubcommand" | "addSubcommandGroup"
    >;

    /**
     * @public
     * @abstract
     * @method execute
     * @description Основная логика команды. Должна быть реализована в каждом
     * конкретном классе команды.
     * @param {CommandInteraction} interaction - Объект взаимодействия.
     * @returns {Promise<void>}
     */
    public abstract execute(interaction: CommandInteraction): Promise<void>;

    /**
     * @protected
     * @method _replyWithError
     * @description Вспомогательный метод для отправки стандартизированного сообщения об ошибке.
     * Может быть использован в дочерних командах для унификации обработки ошибок.
     * // TODO: Расширить логику, возможно, добавив логирование.
     * @param {CommandInteraction} interaction - Объект взаимодействия для ответа.
     * @param {string} message - Текст ошибки для пользователя.
     * @returns {Promise<void>}
     */
    protected async _replyWithError(
        interaction: CommandInteraction,
        message: string = "An unexpected error occurred while executing this command."
    ): Promise<void> {
        const errorPayload = {
            content: `❌ ${message}`,
            ephemeral: true,
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorPayload);
        } else {
            await interaction.reply(errorPayload);
        }
    }
}
