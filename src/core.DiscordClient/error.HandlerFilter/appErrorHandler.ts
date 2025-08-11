/**
 * @file discord-exception.filter.ts
 * @description Глобальный фильтр для перехвата всех необработанных исключений.
 * ВЕРСИЯ 2.0: Использует ErrorLoggerService. Без отправки Embed.
 */
import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    Inject,
    Logger,
} from "@nestjs/common";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { CommandInteraction } from "discord.js";
import { ErrorLoggerService } from "@err/services/ErrorLoggerService";

@Catch()
export class appErrorHandler implements ExceptionFilter {
    private readonly _logger = new Logger(appErrorHandler.name);

    constructor(
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory,

        private readonly _errorLogger: ErrorLoggerService
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
            this._logger.error(
                `Failed to send error reply to user for error ID ${errorId}:`,
                replyError
            );
        }
    }
}
