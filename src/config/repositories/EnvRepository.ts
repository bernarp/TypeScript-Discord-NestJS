/**
 * @file EnvRepository.ts
 * @description Реализация репозитория для работы с переменными окружения.
 * @version 1.0.0
 * @author System
 */

import { Injectable } from "@nestjs/common";
import * as dotenv from "dotenv";
import * as path from "path";
import { IEnvRepository } from "@config/interfaces/IEnvRepository";
import { ILogger } from "@logger";

@Injectable()
export class EnvRepository implements IEnvRepository {
    private readonly _envConfig: Record<string, string>;

    constructor(private readonly _logger: ILogger) {
        this._envConfig = this._loadAndValidateEnv();
        this._logger.inf("EnvRepository initialized and .env file validated.");
    }

    /**
     * @inheritdoc
     */
    public getEnv<T>(key: string, defaultValue?: T): T {
        const value = this._envConfig[key];
        if (value !== undefined) {
            if (typeof defaultValue === "number" && !isNaN(Number(value)))
                return Number(value) as T;
            if (typeof defaultValue === "boolean")
                return (value.toLowerCase() === "true") as T;
            return value as T;
        }
        if (defaultValue !== undefined) return defaultValue;
        throw new Error(`Configuration key "${key}" not found in .env file.`);
    }

    /**
     * @inheritdoc
     */
    public hasEnv(key: string): boolean {
        return this._envConfig.hasOwnProperty(key);
    }

    private _loadAndValidateEnv(): Record<string, string> {
        const envPath = path.resolve(process.cwd(), ".env");
        const result = dotenv.config({ path: envPath });

        if (result.error) {
            this._logger.fatal(
                `FATAL: .env file error: ${result.error.message}`,
                result.error.stack
            );
            throw result.error;
        }
        if (!result.parsed) {
            const error = new Error(
                "FATAL: .env file is empty or could not be parsed."
            );
            this._logger.fatal(error.message, error.stack);
            throw error;
        }

        const requiredKeys = ["TOKEN", "CLIENT_ID", "GUILD_ID"];
        const missingKeys = requiredKeys.filter((key) => !result.parsed?.[key]);

        if (missingKeys.length > 0) {
            const error = new Error(
                `FATAL: Missing required .env keys: ${missingKeys.join(", ")}`
            );
            this._logger.fatal(error.message, error.stack);
            throw error;
        }

        return result.parsed;
    }
}
