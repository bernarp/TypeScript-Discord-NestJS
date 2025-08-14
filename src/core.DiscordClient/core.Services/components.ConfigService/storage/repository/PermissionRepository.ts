/**
 * @file PermissionRepository.ts
 * @description Реализация репозитория для управления правами доступа.
 * @version 1.1.0 (Corrected caching and data access)
 * @author System
 */

import { Inject, Injectable } from "@nestjs/common";
import { IPermissionGroup } from "@interface/IPermissionGroup";
import { PermissionNode } from "@permissions/permissions.dictionary";
import { IPermissionRepository } from "@interface/config/repository/IPermissionRepository";
import { IStorageStrategy } from "@interface/config/storage/IStorageStrategy";
import { IGuildSettings } from "@type/IGuildSettings";
import { ILogger } from "@interface/logger/ILogger";

@Injectable()
export class PermissionRepository implements IPermissionRepository {
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
            "Initializing PermissionRepository: loading data into cache..."
        );
        this._cache = await this._storage.load();
        this._logger.inf(
            `Loaded permissions from ${this._cache.size} guild configurations.`
        );
        return this;
    }

    private async _updateData(
        guildId: string,
        updateFn: (settings: IGuildSettings) => void
    ): Promise<void> {
        const settings = this._cache.get(guildId) || {};

        updateFn(settings);

        this._cache.set(guildId, settings);
        await this._storage.save(this._cache);
    }

    public async getGroup(
        guildId: string,
        groupKey: string
    ): Promise<IPermissionGroup | undefined> {
        return this._cache.get(guildId)?.permissionGroups?.[groupKey];
    }

    public async getAllGroups(
        guildId: string
    ): Promise<Record<string, IPermissionGroup> | undefined> {
        return this._cache.get(guildId)?.permissionGroups;
    }

    public async createGroup(
        guildId: string,
        groupKey: string,
        groupName: string
    ): Promise<void> {
        await this._updateData(guildId, (settings) => {
            if (!settings.permissionGroups) settings.permissionGroups = {};
            if (settings.permissionGroups[groupKey]) {
                throw new Error(
                    `Группа прав с ключом "${groupKey}" уже существует.`
                );
            }
            settings.permissionGroups[groupKey] = {
                name: groupName,
                roleIds: [],
                permissions: [],
                inherits: [],
            };
            this._logger.inf(
                `Permission group '${groupKey}' created for guild ${guildId}.`
            );
        });
    }

    public async deleteGroup(guildId: string, groupKey: string): Promise<void> {
        await this._updateData(guildId, (settings) => {
            if (!settings.permissionGroups?.[groupKey]) {
                throw new Error(
                    `Группа прав с ключом "${groupKey}" не найдена.`
                );
            }
            for (const key in settings.permissionGroups) {
                if (
                    settings.permissionGroups[key].inherits.includes(groupKey)
                ) {
                    throw new Error(
                        `Невозможно удалить группу "${groupKey}", так как она наследуется группой "${key}".`
                    );
                }
            }
            delete settings.permissionGroups[groupKey];
            this._logger.inf(
                `Permission group '${groupKey}' deleted for guild ${guildId}.`
            );
        });
    }

    public async addRoleToGroup(
        guildId: string,
        groupKey: string,
        roleId: string
    ): Promise<void> {
        await this._updateData(guildId, (settings) => {
            const group = settings.permissionGroups?.[groupKey];
            if (!group)
                throw new Error(`Группа прав "${groupKey}" не найдена.`);
            if (!group.roleIds.includes(roleId)) {
                group.roleIds.push(roleId);
            }
        });
    }

    public async removeRoleFromGroup(
        guildId: string,
        groupKey: string,
        roleId: string
    ): Promise<void> {
        await this._updateData(guildId, (settings) => {
            const group = settings.permissionGroups?.[groupKey];
            if (!group)
                throw new Error(`Группа прав "${groupKey}" не найдена.`);
            const index = group.roleIds.indexOf(roleId);
            if (index > -1) {
                group.roleIds.splice(index, 1);
            }
        });
    }

    public async grantPermissionToGroup(
        guildId: string,
        groupKey: string,
        permissionNode: PermissionNode
    ): Promise<void> {
        await this._updateData(guildId, (settings) => {
            const group = settings.permissionGroups?.[groupKey];
            if (!group)
                throw new Error(`Группа прав "${groupKey}" не найдена.`);
            if (!group.permissions.includes(permissionNode)) {
                group.permissions.push(permissionNode);
            }
        });
    }

    public async revokePermissionFromGroup(
        guildId: string,
        groupKey: string,
        permissionNode: PermissionNode
    ): Promise<void> {
        await this._updateData(guildId, (settings) => {
            const group = settings.permissionGroups?.[groupKey];
            if (!group)
                throw new Error(`Группа прав "${groupKey}" не найдена.`);
            const index = group.permissions.indexOf(permissionNode);
            if (index > -1) {
                group.permissions.splice(index, 1);
            }
        });
    }

    public async setGroupInheritance(
        guildId: string,
        groupKey: string,
        inheritsFrom: string[]
    ): Promise<void> {
        await this._updateData(guildId, (settings) => {
            const groups = settings.permissionGroups;
            if (!groups || !groups[groupKey]) {
                throw new Error(`Целевая группа "${groupKey}" не найдена.`);
            }
            if (inheritsFrom.includes(groupKey)) {
                throw new Error("Группа не может наследоваться от самой себя.");
            }
            for (const parentKey of inheritsFrom) {
                if (!groups[parentKey]) {
                    throw new Error(
                        `Родительская группа "${parentKey}" не найдена.`
                    );
                }
            }
            groups[groupKey].inherits = inheritsFrom;
        });
    }
}
