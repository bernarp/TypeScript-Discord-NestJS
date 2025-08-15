/**
 * @file PermissionRepository.ts
 * @description Реализация репозитория для управления правами доступа.
 * @version 1.2.0 (Works with GuildSettingsRepository cache)
 * @author System
 */

import { Inject, Injectable } from "@nestjs/common";
import { IPermissionGroup } from "@interface/IPermissionGroup";
import { PermissionNode } from "@permissions/permissions.dictionary";
import { IPermissionRepository } from "@interface/config/repository/IPermissionRepository";
import { IGuildSettingsRepository } from "@interface/config/repository/IGuildSettingsRepository";
import { IGuildSettings } from "@type/IGuildSettings";
import { ILogger } from "@interface/logger/ILogger";

@Injectable()
export class PermissionRepository implements IPermissionRepository {
    constructor(
        // --- ИЗМЕНЕНИЕ ЗДЕСЬ: Зависимость от другого репозитория, а не от стратегии ---
        @Inject("IGuildSettingsRepository")
        private readonly _guildSettingsRepo: IGuildSettingsRepository,
        @Inject("ILogger")
        private readonly _logger: ILogger
    ) {}

    private async _updatePermissions(
        guildId: string,
        updateFn: (
            groups: Record<string, IPermissionGroup>
        ) => Record<string, IPermissionGroup>
    ): Promise<void> {
        const currentSettings =
            (await this._guildSettingsRepo.getGuildSettings(guildId)) || {};
        const currentGroups = currentSettings.permissionGroups || {};

        const updatedGroups = updateFn(currentGroups);

        await this._guildSettingsRepo.setGuildSettings(guildId, {
            permissionGroups: updatedGroups,
        });
    }

    public async getGroup(
        guildId: string,
        groupKey: string
    ): Promise<IPermissionGroup | undefined> {
        const settings = await this._guildSettingsRepo.getGuildSettings(
            guildId
        );
        return settings?.permissionGroups?.[groupKey];
    }

    public async getAllGroups(
        guildId: string
    ): Promise<Record<string, IPermissionGroup> | undefined> {
        const settings = await this._guildSettingsRepo.getGuildSettings(
            guildId
        );
        return settings?.permissionGroups;
    }

    public async createGroup(
        guildId: string,
        groupKey: string,
        groupName: string
    ): Promise<void> {
        await this._updatePermissions(guildId, (groups) => {
            if (groups[groupKey]) {
                throw new Error(
                    `Группа прав с ключом "${groupKey}" уже существует.`
                );
            }
            groups[groupKey] = {
                name: groupName,
                roleIds: [],
                permissions: [],
                inherits: [],
            };
            this._logger.inf(
                `Permission group '${groupKey}' created for guild ${guildId}.`
            );
            return groups;
        });
    }

    public async deleteGroup(guildId: string, groupKey: string): Promise<void> {
        await this._updatePermissions(guildId, (groups) => {
            if (!groups?.[groupKey]) {
                throw new Error(
                    `Группа прав с ключом "${groupKey}" не найдена.`
                );
            }
            for (const key in groups) {
                if (groups[key].inherits.includes(groupKey)) {
                    throw new Error(
                        `Невозможно удалить группу "${groupKey}", так как она наследуется группой "${key}".`
                    );
                }
            }
            delete groups[groupKey];
            this._logger.inf(
                `Permission group '${groupKey}' deleted for guild ${guildId}.`
            );
            return groups;
        });
    }

    public async addRoleToGroup(
        guildId: string,
        groupKey: string,
        roleId: string
    ): Promise<void> {
        await this._updatePermissions(guildId, (groups) => {
            const group = groups[groupKey];
            if (!group)
                throw new Error(`Группа прав "${groupKey}" не найдена.`);
            if (!group.roleIds.includes(roleId)) {
                group.roleIds.push(roleId);
            }
            return groups;
        });
    }

    public async removeRoleFromGroup(
        guildId: string,
        groupKey: string,
        roleId: string
    ): Promise<void> {
        await this._updatePermissions(guildId, (groups) => {
            const group = groups[groupKey];
            if (!group)
                throw new Error(`Группа прав "${groupKey}" не найдена.`);
            const index = group.roleIds.indexOf(roleId);
            if (index > -1) {
                group.roleIds.splice(index, 1);
            }
            return groups;
        });
    }

    public async grantPermissionToGroup(
        guildId: string,
        groupKey: string,
        permissionNode: PermissionNode
    ): Promise<void> {
        await this._updatePermissions(guildId, (groups) => {
            const group = groups[groupKey];
            if (!group)
                throw new Error(`Группа прав "${groupKey}" не найдена.`);
            if (!group.permissions.includes(permissionNode)) {
                group.permissions.push(permissionNode);
            }
            return groups;
        });
    }

    public async revokePermissionFromGroup(
        guildId: string,
        groupKey: string,
        permissionNode: PermissionNode
    ): Promise<void> {
        await this._updatePermissions(guildId, (groups) => {
            const group = groups[groupKey];
            if (!group)
                throw new Error(`Группа прав "${groupKey}" не найдена.`);
            const index = group.permissions.indexOf(permissionNode);
            if (index > -1) {
                group.permissions.splice(index, 1);
            }
            return groups;
        });
    }

    public async setGroupInheritance(
        guildId: string,
        groupKey: string,
        inheritsFrom: string[]
    ): Promise<void> {
        await this._updatePermissions(guildId, (groups) => {
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
            return groups;
        });
    }
}
