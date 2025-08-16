/**
 * @file TicketSettings.repository.ts
 * @description Реализация репозитория для управления настройками модуля тикетов.
 */

import { Inject, Injectable } from "@nestjs/common";
import { ILogger } from "@logger";
import { IStorageStrategy } from "@config/storage/IStorageStrategy";
import { ITicketSettings } from "../interfaces/ITicketSettings";
import { ITicketSettingsRepository } from "../interfaces/ITicketSettingsRepository";

@Injectable()
export class TicketSettingsRepository implements ITicketSettingsRepository {
    private _cache: Map<string, ITicketSettings> = new Map();

    constructor(
        @Inject("TicketSettingsStorageStrategy")
        private readonly _storage: IStorageStrategy<
            Map<string, ITicketSettings>
        >,
        @Inject("ILogger")
        private readonly _logger: ILogger
    ) {}

    public async init(): Promise<this> {
        this._logger.inf(
            "Initializing TicketSettingsRepository: loading data into cache..."
        );
        const loadedData = await this._storage.load();
        this._cache =
            loadedData instanceof Map
                ? loadedData
                : new Map(Object.entries(loadedData));
        this._logger.inf(
            `Loaded ${this._cache.size} ticket configurations into cache.`
        );
        return this;
    }

    public async get(guildId: string): Promise<ITicketSettings | null> {
        return this._cache.get(guildId) ?? null;
    }

    public async set(
        guildId: string,
        settings: Partial<ITicketSettings>
    ): Promise<ITicketSettings> {
        const currentSettings = this._cache.get(guildId) || {
            categoryMappings: {},
            moderatorRoleIds: [],
            maxTicketsPerUser: 1,
        };

        const updatedSettings: ITicketSettings = {
            ...currentSettings,
            ...settings,
            categoryMappings: {
                ...currentSettings.categoryMappings,
                ...settings.categoryMappings,
            },
        };

        this._cache.set(guildId, updatedSettings);
        await this._storage.save(this._cache);
        this._logger.debug(`Ticket settings updated for guild ${guildId}.`);

        return updatedSettings;
    }
}

