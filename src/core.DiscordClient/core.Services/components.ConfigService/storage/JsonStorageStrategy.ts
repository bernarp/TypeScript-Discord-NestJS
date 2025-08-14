/**
 * @file JsonStorageStrategy.ts
 * @description Реализация стратегии хранения, использующей локальный JSON-файл.
 * @version 1.1.0 (Corrected Map handling)
 * @author System
 */

import * as fs from "fs/promises";
import * as path from "path";
import { IStorageStrategy } from "@interface/config/storage/IStorageStrategy";
import { ILogger } from "@interface/logger/ILogger";

export class JsonStorageStrategy<T extends Map<any, any>>
    implements IStorageStrategy<T>
{
    private readonly _filePath: string;
    private readonly _backupDir: string;

    constructor(
        fileName: string,
        private readonly _logger: ILogger,
        private readonly _defaultValueFactory: () => T
    ) {
        this._filePath = path.resolve(process.cwd(), fileName);
        this._backupDir = path.resolve(process.cwd(), "backups");
    }

    /**
     * @inheritdoc
     */
    public async load(): Promise<T> {
        try {
            await fs.access(this._filePath);
            const fileContent = await fs.readFile(this._filePath, "utf-8");
            const parsedObject = JSON.parse(fileContent);
            return new Map(Object.entries(parsedObject)) as T;
        } catch (error) {
            if (error.code === "ENOENT") {
                this._logger.inf(
                    `Config file not found at ${this._filePath}. Using default value.`
                );
                return this._defaultValueFactory();
            }
            this._logger.err(
                `Failed to load or parse config file: ${this._filePath}`,
                error.stack
            );
            return this._defaultValueFactory();
        }
    }

    /**
     * @inheritdoc
     */
    public async save(data: T): Promise<void> {
        const tempFilePath = this._filePath + ".tmp";

        try {
            const dataToSave = Object.fromEntries(data);
            const jsonString = JSON.stringify(dataToSave, null, 4);
            await fs.writeFile(tempFilePath, jsonString, "utf-8");
            await fs.rename(tempFilePath, this._filePath);
        } catch (error) {
            this._logger.err(
                `Failed to safely save config file: ${this._filePath}`,
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

    /**
     * @inheritdoc
     */
    public async backup(backupName?: string): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const finalBackupName = backupName ?? `config-backup-${timestamp}.json`;

        try {
            await fs.mkdir(this._backupDir, { recursive: true });
            const backupPath = path.join(this._backupDir, finalBackupName);
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

