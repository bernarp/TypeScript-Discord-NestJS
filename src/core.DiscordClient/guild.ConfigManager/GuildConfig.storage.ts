/**
 * @file GuildConfig.storage.ts
 * @description Класс, инкапсулирующий логику чтения и записи конфигурации в JSON-файл.
 */
import { Logger } from "@nestjs/common";
import * as fs from "fs/promises";
import * as path from "path";
import { IGuildSettings } from "@interface/IGuildConfig";

type ConfigCache = Map<string, IGuildSettings>;

export class GuildConfigStorage {
    private readonly _logger = new Logger(GuildConfigStorage.name);
    private readonly _filePath: string;
    private readonly _backupDir: string;

    constructor(fileName: string = "guild-configs.json") {
        this._filePath = path.resolve(process.cwd(), fileName);
        this._backupDir = path.resolve(process.cwd(), "backups");
    }

    /**
     * @method load
     * @description Загружает конфигурации из файла.
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
            this._logger.error("Failed to load or parse config file:", error);
            return new Map();
        }
    }

    /**
     * @method save
     * @description Сохраняет кэш конфигураций в файл.
     * @param {ConfigCache} cache - Кэш для сохранения.
     */
    public async save(cache: ConfigCache): Promise<void> {
        try {
            const dataToSave = Object.fromEntries(cache);
            const jsonString = JSON.stringify(dataToSave, null, 4);
            await fs.writeFile(this._filePath, jsonString, "utf-8");
        } catch (error) {
            this._logger.error("Failed to save config file:", error);
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
            throw error;
        }
    }
}
