/**
 * @file GuildSettingsRepository.ts
 * @description Реализация репозитория для управления настройками гильдий.
 * @version 1.1.0
 * @author System
 */

import { Inject, Injectable } from "@nestjs/common";
import { IGuildSettings, PinnedMessageConfig } from "@type/IGuildSettings";
import { IGuildSettingsRepository } from "@interface/config/repository/IGuildSettingsRepository";
import { IStorageStrategy } from "@interface/config/storage/IStorageStrategy";
import { ILogger } from "@interface/logger/ILogger";

@Injectable()
export class GuildSettingsRepository implements IGuildSettingsRepository {
    private _cache: Map<string, IGuildSettings> = new Map();

    constructor(
        @Inject("GuildConfigStorageStrategy")
        private readonly _storage: IStorageStrategy<
            Map<string, IGuildSettings>
        >,
        @Inject("ILogger")
        private readonly _logger: ILogger
    ) {}

    public async init(): Promise<this> {
        this._logger.inf(
            "Initializing GuildSettingsRepository: loading data into cache..."
        );
        const loadedData = await this._storage.load();
        // Убедимся, что загруженные данные - это Map
        this._cache = new Map(Object.entries(loadedData));
        this._logger.inf(
            `Loaded ${this._cache.size} guild configurations into cache.`
        );
        return this;
    }

    public async getGuildSettings(
        guildId: string
    ): Promise<IGuildSettings | null> {
        return this._cache.get(guildId) ?? null;
    }

    public async getAllGuildSettings(): Promise<[string, IGuildSettings][]> {
        return Array.from(this._cache.entries());
    }

    public async setGuildSettings(
        guildId: string,
        newSettings: Partial<IGuildSettings>
    ): Promise<IGuildSettings> {
        const currentSettings = this._cache.get(guildId) || {};
        const updatedSettings = { ...currentSettings, ...newSettings };
        this._cache.set(guildId, updatedSettings);
        await this._storage.save(this._cache);
        return updatedSettings;
    }

    public async setPinnedMessage(
        guildId: string,
        type: keyof Required<IGuildSettings>["pinnedMessages"],
        config: PinnedMessageConfig
    ): Promise<void> {
        const settings = this._cache.get(guildId) || {};
        const updatedSettings: IGuildSettings = {
            ...settings,
            pinnedMessages: {
                ...settings.pinnedMessages,
                [type]: config,
            },
        };
        this._cache.set(guildId, updatedSettings);
        await this._storage.save(this._cache);
        this._logger.inf(
            `Pinned message '${type}' updated for guild ${guildId}`
        );
    }

    public async deletePinnedMessage(
        guildId: string,
        type: keyof Required<IGuildSettings>["pinnedMessages"]
    ): Promise<void> {
        const currentSettings = this._cache.get(guildId);
        if (!currentSettings?.pinnedMessages?.[type]) {
            return;
        }

        const { [type]: _, ...remainingPinnedMessages } =
            currentSettings.pinnedMessages;
        currentSettings.pinnedMessages = remainingPinnedMessages;
        this._cache.set(guildId, currentSettings);
        await this._storage.save(this._cache);
        this._logger.inf(
            `Pinned message '${type}' deleted for guild ${guildId}`
        );
    }

    /**
     * @inheritdoc
     */
    public async backup(backupName?: string): Promise<string> {
        return this._storage.backup(backupName);
    }
}
