/**
 * @file GuildConfigManager.ts
 * @description Сервис для управления динамической конфигурацией гильдий.
 * Реализует IGuildConfig, используя кэширование и хранение в JSON-файле.
 */
import {
    Injectable,
    Logger,
    OnModuleInit,
    OnApplicationShutdown,
} from "@nestjs/common";
import { GuildConfigStorage } from "./guild.ConfigManager/GuildConfig.storage";
import { IGuildConfig, IGuildSettings } from "@interface/IGuildConfig";

@Injectable()
export class GuildConfigManager
    implements IGuildConfig, OnModuleInit, OnApplicationShutdown
{
    private readonly _logger = new Logger(GuildConfigManager.name);
    private readonly _storage: GuildConfigStorage;
    private _cache: Map<string, IGuildSettings> = new Map();

    constructor() {
        this._storage = new GuildConfigStorage();
    }

    /**
     * @method onModuleInit
     * @description При инициализации модуля загружаем все конфиги в кэш.
     */
    async onModuleInit(): Promise<void> {
        this._logger.log(
            "Initializing GuildConfigManager and loading configs into cache..."
        );
        this._cache = await this._storage.load();
        this._logger.log(`Loaded ${this._cache.size} guild configurations.`);
    }

    /**
     * @method onApplicationShutdown
     * @description При завершении работы приложения принудительно сохраняем все изменения.
     */
    async onApplicationShutdown(signal?: string): Promise<void> {
        this._logger.log(
            `Application is shutting down (signal: ${signal}). Saving guild configs...`
        );
        await this.save();
    }

    /**
     * @inheritdoc
     */
    public async get<T extends IGuildSettings[keyof IGuildSettings]>(
        guildId: string,
        key: keyof IGuildSettings,
        defaultValue?: T
    ): Promise<T | undefined> {
        const guildConfig = this._cache.get(guildId);
        const value = guildConfig?.[key] as T | undefined;

        return value !== undefined ? value : defaultValue;
    }

    /**
     * @inheritdoc
     */
    public async getAll(guildId: string): Promise<IGuildSettings | null> {
        return this._cache.get(guildId) ?? null;
    }

    /**
     * @inheritdoc
     */
    public async set(
        guildId: string,
        newSettings: Partial<IGuildSettings>
    ): Promise<IGuildSettings> {
        const currentSettings = this._cache.get(guildId) || {};
        const updatedSettings = { ...currentSettings, ...newSettings };
        this._cache.set(guildId, updatedSettings);
        await this.save();
        return updatedSettings;
    }

    /**
     * @inheritdoc
     */
    public async save(): Promise<void> {
        try {
            await this._storage.save(this._cache);
            this._logger.debug(
                "Guild configurations have been saved to the file."
            );
        } catch (error) {
            this._logger.error(
                "A critical error occurred while saving guild configurations.",
                error
            );
        }
    }

    /**
     * @inheritdoc
     */
    public async backup(backupName?: string): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const finalBackupName =
            backupName ?? `guild-configs-${timestamp}.json.bak`;
        return this._storage.backup(finalBackupName);
    }
}
