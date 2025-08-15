/**
 * @file discord-exception.filter.ts
 * @description Глобальный фильтр для перехвата всех необработанных исключений.
 * @version 2.1: Рефакторинг для использования кастомного ILogger.
 */
import { ArgumentsHost, Catch, ExceptionFilter, Inject } from "@nestjs/common";
import { IEmbedFactory } from "@common/interfaces/IEmbedFactory";
import { CommandInteraction } from "discord.js";
import { ErrorLoggerService } from "@error-handling/error-logger.service";
import { ILogger } from "@logger";

@Catch()
export class appErrorHandler implements ExceptionFilter {

    constructor(
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory,
        private readonly _errorLogger: ErrorLoggerService,
        @Inject("ILogger") private readonly _logger: ILogger // Стало
    ) {}

    async catch(exception: Error, host: ArgumentsHost) {
        const contextType = host.getType();
        if (contextType !== "rpc") return;

        const interaction = host.getArgByIndex<CommandInteraction>(0);
        if (!interaction || !(interaction instanceof CommandInteraction)) {
            this._logger.warn(
                "Filter caught an error, but could not extract a valid CommandInteraction."
            );
            return;
        }
        const errorId = await this._errorLogger.log(exception, interaction);

        const errorEmbed = this._embedFactory.createErrorEmbed({
            description:
                "Произошла непредвиденная ошибка. Пожалуйста, обратитесь к администрации.",
            fields: [
                {
                    name: "Идентификатор ошибки",
                    value: `\`${errorId}\``,
                    inline: false,
                },
            ],
            context: { user: interaction.user, guild: interaction.guild },
        });

        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    embeds: [errorEmbed],
                    components: [],
                });
            } else {
                await interaction.reply({
                    embeds: [errorEmbed],
                    ephemeral: true,
                });
            }
        } catch (replyError) {
            this._logger.err(
                `Failed to send error reply to user for error ID ${errorId}:`,
                replyError.stack
            );
        }
    }
}
