/**
 * @file ConfigurationService.ts
 * @description Реализация единого сервиса конфигурации.
 * @version 3.2: Рефакторинг для использования кастомного ILogger и его передачи в GuildConfigStorage.
 */
import { Injectable, Inject } from "@nestjs/common";
import * as dotenv from "dotenv";
import * as path from "path";
import { IConfigurationService } from "@interface/IConfigurationService";
import { IGuildSettings } from "@type/IGuildSettings";
import { IPermissionGroup } from "@interface/IPermissionGroup";
import { PermissionNode } from "@permissions/permissions.dictionary";
import { GuildConfigStorage } from "./components.ConfigServices/GuildConfigStorage";
import { GuildPermissionsManager } from "./components.ConfigServices/GuildPermissionsManager";
import { ILogger } from "@interface/logger/ILogger";

@Injectable()
export class ConfigurationService implements IConfigurationService {
    private readonly _storage: GuildConfigStorage;
    private readonly _permissionsManager: GuildPermissionsManager;

    private _envConfig: Record<string, any>;
    private _guildsCache: Map<string, IGuildSettings> = new Map();

    constructor(@Inject("ILogger") private readonly _logger: ILogger) {
        // Стало
        this._envConfig = this._loadAndValidateEnv();
        // Передаем логгер в конструктор
        this._storage = new GuildConfigStorage(this._logger);
        this._permissionsManager = new GuildPermissionsManager(
            this._guildsCache,
            () => this._save()
        );
    }

    public async init(): Promise<this> {
        this._logger.inf("Loading guild configurations into cache...");

        const loadedCache = await this._storage.load();
        this._guildsCache.clear();
        for (const [key, value] of loadedCache.entries()) {
            this._guildsCache.set(key, value);
        }

        this._logger.inf(
            `Loaded ${this._guildsCache.size} guild configurations.`
        );
        return this;
    }

    public getEnv<T>(key: string, defaultValue?: T): T {
        const value = this._envConfig[key];
        if (value !== undefined) return value as T;
        if (defaultValue !== undefined) return defaultValue;
        throw new Error(`Configuration key "${key}" not found.`);
    }

    public hasEnv(key: string): boolean {
        return this._envConfig.hasOwnProperty(key);
    }

    public async getGuildSetting<
        T extends IGuildSettings[keyof IGuildSettings]
    >(
        guildId: string,
        key: keyof IGuildSettings,
        defaultValue?: T
    ): Promise<T | undefined> {
        const guildConfig = this._guildsCache.get(guildId);
        const value = guildConfig?.[key] as T | undefined;
        return value !== undefined ? value : defaultValue;
    }

    public async getAllGuildSettings(
        guildId: string
    ): Promise<IGuildSettings | null> {
        return this._guildsCache.get(guildId) ?? null;
    }

    public async setGuildSettings(
        guildId: string,
        newSettings: Partial<IGuildSettings>
    ): Promise<IGuildSettings> {
        const currentSettings = this._guildsCache.get(guildId) || {};
        const updatedSettings = { ...currentSettings, ...newSettings };
        this._guildsCache.set(guildId, updatedSettings);
        await this._save();
        return updatedSettings;
    }

    public async backup(backupName?: string): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const finalBackupName =
            backupName ?? `guild-configs-backup-${timestamp}.json`;
        return this._storage.backup(finalBackupName);
    }

    public async getPermissionGroups(
        guildId: string
    ): Promise<Record<string, IPermissionGroup> | undefined> {
        return this._permissionsManager.getPermissionGroups(guildId);
    }

    public async getPermissionGroup(
        guildId: string,
        groupKey: string
    ): Promise<IPermissionGroup | undefined> {
        return this._permissionsManager.getPermissionGroup(guildId, groupKey);
    }

    public async createPermissionGroup(
        guildId: string,
        groupKey: string,
        groupName: string
    ): Promise<void> {
        return this._permissionsManager.createPermissionGroup(
            guildId,
            groupKey,
            groupName
        );
    }

    public async deletePermissionGroup(
        guildId: string,
        groupKey: string
    ): Promise<void> {
        return this._permissionsManager.deletePermissionGroup(
            guildId,
            groupKey
        );
    }

    public async addRoleToGroup(
        guildId: string,
        groupKey: string,
        roleId: string
    ): Promise<void> {
        return this._permissionsManager.addRoleToGroup(
            guildId,
            groupKey,
            roleId
        );
    }

    public async removeRoleFromGroup(
        guildId: string,
        groupKey: string,
        roleId: string
    ): Promise<void> {
        return this._permissionsManager.removeRoleFromGroup(
            guildId,
            groupKey,
            roleId
        );
    }

    public async grantPermissionToGroup(
        guildId: string,
        groupKey: string,
        permissionNode: PermissionNode
    ): Promise<void> {
        return this._permissionsManager.grantPermissionToGroup(
            guildId,
            groupKey,
            permissionNode
        );
    }

    public async revokePermissionFromGroup(
        guildId: string,
        groupKey: string,
        permissionNode: PermissionNode
    ): Promise<void> {
        return this._permissionsManager.revokePermissionFromGroup(
            guildId,
            groupKey,
            permissionNode
        );
    }

    public async setGroupInheritance(
        guildId: string,
        groupKey: string,
        inheritsFrom: string[]
    ): Promise<void> {
        return this._permissionsManager.setGroupInheritance(
            guildId,
            groupKey,
            inheritsFrom
        );
    }

    private async _save(): Promise<void> {
        try {
            await this._storage.save(this._guildsCache);
        } catch (error) {
            this._logger.err(
                "Failed to save guild configurations.",
                error.stack
            );
        }
    }

    private _loadAndValidateEnv(): Record<string, string> {
        const envPath = path.resolve(process.cwd(), ".env");
        const result = dotenv.config({ path: envPath });
        if (result.error)
            throw new Error(`FATAL: .env file error: ${result.error.message}`);
        if (!result.parsed) throw new Error("FATAL: .env file is empty.");
        const requiredKeys = ["TOKEN", "CLIENT_ID", "GUILD_ID"];
        const missingKeys = requiredKeys.filter((key) => !result.parsed?.[key]);
        if (missingKeys.length > 0)
            throw new Error(
                `FATAL: Missing .env keys: ${missingKeys.join(", ")}`
            );
        return result.parsed;
    }
}
