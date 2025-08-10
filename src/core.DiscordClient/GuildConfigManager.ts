/**
 * @file GuildConfigManager.ts
 * @description Сервис для управления динамической конфигурацией гильдий.
 * ВЕРСИЯ 3.0: Исправлена критическая ошибка с жизненным циклом и сохранением данных.
 */
import {
    Injectable,
    Logger,
    OnModuleInit,
    OnApplicationShutdown,
} from "@nestjs/common";
import { GuildConfigStorage } from "./guild.ConfigManager/GuildConfig.storage";
import { IGuildConfig, IGuildSettings } from "@interface/IGuildConfig";
import { GuildConfigPermissionsManager } from "./guild.ConfigManager/GuildConfig.permissions";
import { PermissionNode } from "@permissions/permissions.dictionary";
import { IPermissionGroup } from "@interface/IPermissionGroup";

@Injectable()
export class GuildConfigManager
    implements IGuildConfig, OnModuleInit, OnApplicationShutdown
{
    private readonly _logger = new Logger(GuildConfigManager.name);
    private readonly _storage: GuildConfigStorage;
    private _cache: Map<string, IGuildSettings> = new Map();

    // ИЗМЕНЕНИЕ: Объявляем свойство, но не инициализируем его здесь.
    private _permissions: GuildConfigPermissionsManager;

    constructor() {
        this._storage = new GuildConfigStorage();
    }

    /**
     * @method onModuleInit
     * @description При инициализации модуля загружаем все конфиги в кэш.
     */
    public async onModuleInit(): Promise<void> {
        this._logger.log(
            "Initializing GuildConfigManager and loading configs into cache..."
        );
        this._cache = await this._storage.load();
        this._logger.log(`Loaded ${this._cache.size} guild configurations.`);
        this._permissions = new GuildConfigPermissionsManager(this._cache, () =>
            this.save()
        );
    }

    public async onApplicationShutdown(signal?: string): Promise<void> {
        this._logger.log(
            `Application is shutting down (signal: ${signal}). Saving guild configs...`
        );
        await this.save();
    }

    // --- Базовые методы ---

    public async get<T extends IGuildSettings[keyof IGuildSettings]>(
        guildId: string,
        key: keyof IGuildSettings,
        defaultValue?: T
    ): Promise<T | undefined> {
        const guildConfig = this._cache.get(guildId);
        const value = guildConfig?.[key] as T | undefined;

        return value !== undefined ? value : defaultValue;
    }

    public async getAll(guildId: string): Promise<IGuildSettings | null> {
        return this._cache.get(guildId) ?? null;
    }

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

    public async backup(backupName?: string): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const finalBackupName =
            backupName ?? `guild-configs-${timestamp}.json.bak`;
        return this._storage.backup(finalBackupName);
    }

    public async getPermissionGroups(
        guildId: string
    ): Promise<Record<string, IPermissionGroup> | undefined> {
        return this._permissions.getPermissionGroups(guildId);
    }

    public async getPermissionGroup(
        guildId: string,
        groupKey: string
    ): Promise<IPermissionGroup | undefined> {
        return this._permissions.getPermissionGroup(guildId, groupKey);
    }

    public async createPermissionGroup(
        guildId: string,
        groupKey: string,
        groupName: string
    ): Promise<void> {
        return this._permissions.createPermissionGroup(
            guildId,
            groupKey,
            groupName
        );
    }

    public async deletePermissionGroup(
        guildId: string,
        groupKey: string
    ): Promise<void> {
        return this._permissions.deletePermissionGroup(guildId, groupKey);
    }

    public async addRoleToGroup(
        guildId: string,
        groupKey: string,
        roleId: string
    ): Promise<void> {
        return this._permissions.addRoleToGroup(guildId, groupKey, roleId);
    }

    public async removeRoleFromGroup(
        guildId: string,
        groupKey: string,
        roleId: string
    ): Promise<void> {
        return this._permissions.removeRoleFromGroup(guildId, groupKey, roleId);
    }

    public async grantPermissionToGroup(
        guildId: string,
        groupKey: string,
        permissionNode: PermissionNode
    ): Promise<void> {
        return this._permissions.grantPermissionToGroup(
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
        return this._permissions.revokePermissionFromGroup(
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
        return this._permissions.setGroupInheritance(
            guildId,
            groupKey,
            inheritsFrom
        );
    }
}
