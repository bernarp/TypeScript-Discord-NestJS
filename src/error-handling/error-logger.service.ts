/**
 * @file ErrorLoggerService.ts
 * @description Сервис для логирования ошибок с уникальным ID и сохранением их в файл.
 * @version 1.1: Рефакторинг для использования кастомного ILogger.
 */
import { Injectable, Inject } from "@nestjs/common";
import { CommandInteraction } from "discord.js";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs/promises";
import * as path from "path";
import { IErrorLog } from "@error-handling/interfaces/IErrorLog";
import { ILogger } from "@logger";

@Injectable()
export class ErrorLoggerService {
    private readonly _logDirectory = path.resolve(process.cwd(), "logs/errors"); // Рекомендую подпапку

    constructor(@Inject("ILogger") private readonly _logger: ILogger) {
        // Стало
        this._ensureLogDirectoryExists();
    }

    public async log(
        exception: Error,
        interaction: CommandInteraction
    ): Promise<string> {
        const errorId = uuidv4();
        const logData: IErrorLog = {
            errorId,
            timestamp: new Date().toISOString(),
            command: {
                name: interaction.commandName,
                id: interaction.commandId,
            },
            user: {
                tag: interaction.user.tag,
                id: interaction.user.id,
            },
            guild: interaction.inGuild()
                ? {
                      name: interaction.guild.name,
                      id: interaction.guild.id,
                  }
                : undefined,
            error: {
                name: exception.name,
                message: exception.message,
                stack: exception.stack,
            },
        };

        try {
            const filePath = path.join(this._logDirectory, `${errorId}.json`);
            await fs.writeFile(filePath, JSON.stringify(logData, null, 4));
            this._logger.inf(`Successfully logged error with ID: ${errorId}`);
        } catch (writeError) {
            this._logger.err(
                `Failed to write error log to file for ID: ${errorId}`,
                writeError.stack
            );
        }

        return errorId;
    }

    private async _ensureLogDirectoryExists(): Promise<void> {
        try {
            await fs.access(this._logDirectory);
        } catch (error) {
            this._logger.inf(
                `Error logs directory not found. Creating at: ${this._logDirectory}`
            );
            await fs.mkdir(this._logDirectory, { recursive: true });
        }
    }
}
