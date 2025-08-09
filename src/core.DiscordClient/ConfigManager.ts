/**
 * @file ConfigManager.ts
 * @description Реализует интерфейс IConfig. Отвечает за загрузку, валидацию
 * и предоставление доступа к конфигурационным переменным из .env файла.
 */

import { Injectable } from "@nestjs/common";
// ИЗМЕНЕНИЕ: Используем относительный путь для импорта интерфейса.
import { IConfig } from "./abstractions/interface/IConfig";
import * as dotenv from "dotenv";
import * as path from "path";

/**
 * @class ConfigManager
 * @description Реализует интерфейс IConfig.
 * @implements {IConfig}
 */
@Injectable()
export class ConfigManager implements IConfig {
    private readonly _config: Record<string, any>;

    public constructor() {
        this._config = this._loadConfig();
        this._validateConfig();
    }

    private _loadConfig(): Record<string, string> {
        const envPath = path.resolve(process.cwd(), ".env");
        const result = dotenv.config({ path: envPath });

        if (result.error) {
            throw new Error(
                `FATAL: Could not load .env file. Please ensure it exists in the project root. Details: ${result.error.message}`
            );
        }

        if (!result.parsed) {
            throw new Error(
                "FATAL: .env file is empty or could not be parsed."
            );
        }

        return result.parsed;
    }

    private _validateConfig(): void {
        const requiredKeys: string[] = [
            "TOKEN",
            "CLIENT_ID",
            "GUILD_ID",
            "DATABASE_URL",
            "LOG_CHANNEL_ID",
        ];
        const missingKeys = requiredKeys.filter((key) => !this.has(key));
        if (missingKeys.length > 0) {
            throw new Error(
                `FATAL: Missing required configuration keys: ${missingKeys.join(
                    ", "
                )}`
            );
        }
    }

    public get<T>(key: string, defaultValue?: T): T {
        const value = this._config[key];
        if (value !== undefined) {
            return value as T;
        }
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(
            `Configuration key "${key}" not found and no default value was provided.`
        );
    }

    public has(key: string): boolean {
        return this._config.hasOwnProperty(key);
    }
}
