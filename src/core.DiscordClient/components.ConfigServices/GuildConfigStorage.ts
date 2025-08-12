/**
 * @file GuildConfigStorage.ts
 * @description Класс, инкапсулирующий логику чтения и записи конфигурации гильдий в JSON-файл.
 * Не является инъекционным сервисом, используется как компонент внутри ConfigurationService.
 */
import { Logger } from "@nestjs/common";
import * as fs from "fs/promises";
import * as path from "path";
import { IGuildSettings } from "../abstractions/types/IGuildSettings";

type ConfigCache = Map<string, IGuildSettings>;

export class GuildConfigStorage {
    private readonly _logger = new Logger(GuildConfigStorage.name);
    private readonly _filePath: string;
    private readonly _backupDir: string;

    /**
     * @constructor
     * @param {string} [fileName='guild-configs.json'] - Имя файла для хранения конфигураций.
     */
    constructor(fileName: string = "guild-configs.json") {
        this._filePath = path.resolve(process.cwd(), fileName);
        this._backupDir = path.resolve(process.cwd(), "backups");
    }

    /**
     * @method load
     * @description Загружает конфигурации из файла. Если файл не найден, возвращает пустой Map.
     * @returns {Promise<ConfigCache>} Кэш конфигураций.
     */
    public async load(): Promise<ConfigCache> {
        try {
            await fs.access(this._filePath);
            const fileContent = await fs.readFile(this._filePath, "utf-8");
            const parsedData = JSON.parse(fileContent);
            return new Map(Object.entries(parsedData));
        } catch (error) {
            if (error.code === "ENOENT") {
                this._logger.log(
                    `Config file not found at ${this._filePath}. A new one will be created on first save.`
                );
                return new Map();
            }
            this._logger.error(
                "Failed to load or parse guild config file:",
                error
            );
            return new Map();
        }
    }

    /**
     * @method save
     * @description Безопасно сохраняет кэш конфигураций в файл.
     * Использует стратегию "запись во временный файл -> переименование",
     * чтобы гарантировать, что основной файл конфигурации не будет поврежден,
     * если процесс завершится во время операции записи.
     * @param {ConfigCache} cache - Кэш для сохранения.
     */
    public async save(cache: ConfigCache): Promise<void> {
        const tempFilePath = this._filePath + ".tmp";

        try {
            const dataToSave = Object.fromEntries(cache);
            const jsonString = JSON.stringify(dataToSave, null, 4);
            await fs.writeFile(tempFilePath, jsonString, "utf-8");
            await fs.rename(tempFilePath, this._filePath);
        } catch (error) {
            this._logger.error(
                "Failed to safely save guild config file:",
                error
            );
            try {
                await fs.unlink(tempFilePath);
            } catch (cleanupError) {
                if (cleanupError.code !== "ENOENT") {
                    this._logger.error(
                        `Failed to cleanup temporary file ${tempFilePath}:`,
                        cleanupError
                    );
                }
            }
            throw error; 
        }
    }

    /**
     * @method backup
     * @description Создает резервную копию файла.
     * @param {string} backupName - Имя файла бэкапа.
     * @returns {Promise<string>} Путь к файлу бэкапа.
     */
    public async backup(backupName: string): Promise<string> {
        try {
            await fs.mkdir(this._backupDir, { recursive: true });
            const backupPath = path.join(this._backupDir, backupName);
            await fs.copyFile(this._filePath, backupPath);
            this._logger.log(`Successfully created backup at ${backupPath}`);
            return backupPath;
        } catch (error) {
            this._logger.error("Failed to create backup:", error);
            if (error.code === "ENOENT") {
                this._logger.warn(
                    `Could not create backup because source file does not exist yet: ${this._filePath}`
                );
            }
            throw error;
        }
    }
}
