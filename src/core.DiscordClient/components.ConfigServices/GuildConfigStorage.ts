/**
 * @file GuildConfigStorage.ts
 * @description Класс, инкапсулирующий логику чтения и записи конфигурации гильдий в JSON-файл.
 * Не является иньекционным сервисом, используется как компонент внутри ConfigurationService.
 * @version 1.1: Рефакторинг для использования кастомного ILogger, получаемого через конструктор.
 */
import * as fs from "fs/promises";
import * as path from "path";
import { IGuildSettings } from "@type/IGuildSettings";
import { ILogger } from "@interface/logger/ILogger";

type ConfigCache = Map<string, IGuildSettings>;

export class GuildConfigStorage {
    private readonly _filePath: string;
    private readonly _backupDir: string;

    /**
     * @constructor
     * @param {ILogger} _logger - Экземпляр сервиса логирования, переданный из родительского сервиса.
     * @param {string} [fileName='guild-configs.json'] - Имя файла для хранения конфигураций.
     */
    constructor(
        private readonly _logger: ILogger, 
        fileName: string = "guild-configs.json"
    ) {
        this._filePath = path.resolve(process.cwd(), fileName);
        this._backupDir = path.resolve(process.cwd(), "backups");
    }

    public async load(): Promise<ConfigCache> {
        try {
            await fs.access(this._filePath);
            const fileContent = await fs.readFile(this._filePath, "utf-8");
            const parsedData = JSON.parse(fileContent);
            return new Map(Object.entries(parsedData));
        } catch (error) {
            if (error.code === "ENOENT") {
                this._logger.inf(
                    `Config file not found at ${this._filePath}. A new one will be created on first save.`
                );
                return new Map();
            }
            this._logger.err(
                "Failed to load or parse guild config file:",
                error.stack
            );
            return new Map();
        }
    }

    public async save(cache: ConfigCache): Promise<void> {
        const tempFilePath = this._filePath + ".tmp";

        try {
            const dataToSave = Object.fromEntries(cache);
            const jsonString = JSON.stringify(dataToSave, null, 4);
            await fs.writeFile(tempFilePath, jsonString, "utf-8");
            await fs.rename(tempFilePath, this._filePath);
        } catch (error) {
            this._logger.err(
                "Failed to safely save guild config file:",
                error.stack
            );
            try {
                await fs.unlink(tempFilePath);
            } catch (cleanupError) {
                if (cleanupError.code !== "ENOENT") {
                    this._logger.err(
                        `Failed to cleanup temporary file ${tempFilePath}:`,
                        cleanupError.stack
                    );
                }
            }
            throw error;
        }
    }

    public async backup(backupName: string): Promise<string> {
        try {
            await fs.mkdir(this._backupDir, { recursive: true });
            const backupPath = path.join(this._backupDir, backupName);
            await fs.copyFile(this._filePath, backupPath);
            this._logger.inf(`Successfully created backup at ${backupPath}`);
            return backupPath;
        } catch (error) {
            this._logger.err("Failed to create backup:", error.stack);
            if (error.code === "ENOENT") {
                this._logger.warn(
                    `Could not create backup because source file does not exist yet: ${this._filePath}`
                );
            }
            throw error;
        }
    }
}
