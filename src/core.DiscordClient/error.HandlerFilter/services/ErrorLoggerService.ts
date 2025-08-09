/**
 * @file ErrorLoggerService.ts
 * @description Сервис для логирования ошибок с уникальным ID и сохранения их в файл.
 */
import { Injectable, Logger } from "@nestjs/common";
import { CommandInteraction } from "discord.js";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs/promises";
import * as path from "path";
import { ErrorLog } from "@interface/error/IErrorLog";

/**
 * @interface ErrorLog
 * @description Структура данных для лога ошибки.
 */

@Injectable()
export class ErrorLoggerService {
    private readonly _logger = new Logger(ErrorLoggerService.name);
    private readonly _logDirectory = path.resolve(process.cwd(), "logs");

    constructor() {
        this._ensureLogDirectoryExists();
    }

    /**
     * @method log
     * @description Основной метод, который обрабатывает, форматирует и сохраняет ошибку.
     * @param {Error} exception - Перехваченное исключение.
     * @param {CommandInteraction} interaction - Взаимодействие, в котором произошла ошибка.
     * @returns {Promise<string>} Уникальный ID, присвоенный ошибке.
     */
    public async log(
        exception: Error,
        interaction: CommandInteraction
    ): Promise<string> {
        const errorId = uuidv4();
        const logData: ErrorLog = {
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
            this._logger.log(`Successfully logged error with ID: ${errorId}`);
        } catch (writeError) {
            this._logger.error(
                `Failed to write error log to file for ID: ${errorId}`,
                writeError
            );
        }

        return errorId;
    }

    /**
     * @private
     * @method _ensureLogDirectoryExists
     * @description Проверяет наличие директории для логов и создает ее, если она отсутствует.
     */
    private async _ensureLogDirectoryExists(): Promise<void> {
        try {
            await fs.access(this._logDirectory);
        } catch (error) {
            this._logger.log(
                `Logs directory not found. Creating at: ${this._logDirectory}`
            );
            await fs.mkdir(this._logDirectory, { recursive: true });
        }
    }
}
