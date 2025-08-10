/**
 * @file GuildConfig.permissions.ts
 * @description Вспомогательный класс для инкапсуляции логики управления правами доступа (Permission Groups).
 * ВЕРСИЯ 2.0: Исправлена критическая ошибка - добавлено сохранение изменений в файл.
 */
import { IGuildSettings } from "@interface/IGuildConfig";
import { PermissionNode } from "@permissions/permissions.dictionary";
import { IPermissionGroup } from "@interface/IPermissionGroup";
export class GuildConfigPermissionsManager {
    /**
     * @param _cache Ссылка на основной кэш из GuildConfigManager.
     * @param _saveCallback Функция обратного вызова для сохранения изменений.
     */
    constructor(
        private readonly _cache: Map<string, IGuildSettings>,
        private readonly _saveCallback: () => Promise<void>
    ) {}

    public async getPermissionGroups(
        guildId: string
    ): Promise<Record<string, IPermissionGroup> | undefined> {
        const settings = await this._getGuildSettings(guildId);
        return settings.permissionGroups;
    }

    public async getPermissionGroup(
        guildId: string,
        groupKey: string
    ): Promise<IPermissionGroup | undefined> {
        const groups = await this.getPermissionGroups(guildId);
        return groups?.[groupKey];
    }

    public async createPermissionGroup(
        guildId: string,
        groupKey: string,
        groupName: string
    ): Promise<void> {
        const groups = await this._getGuildPermissionGroups(guildId);
        if (groups[groupKey]) {
            throw new Error(
                `Группа прав с системным именем "${groupKey}" уже существует.`
            );
        }

        groups[groupKey] = {
            name: groupName,
            roleIds: [],
            permissions: [],
            inherits: [],
        };

        await this._saveCallback();
    }

    public async deletePermissionGroup(
        guildId: string,
        groupKey: string
    ): Promise<void> {
        const groups = await this._getGuildPermissionGroups(guildId);
        if (!groups[groupKey]) {
            throw new Error(
                `Группа прав с системным именем "${groupKey}" не найдена.`
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
        await this._saveCallback();
    }

    public async addRoleToGroup(
        guildId: string,
        groupKey: string,
        roleId: string
    ): Promise<void> {
        const group = await this._findGroupOrFail(guildId, groupKey);
        if (!group.roleIds.includes(roleId)) {
            group.roleIds.push(roleId);
            await this._saveCallback();
        }
    }

    public async removeRoleFromGroup(
        guildId: string,
        groupKey: string,
        roleId: string
    ): Promise<void> {
        const group = await this._findGroupOrFail(guildId, groupKey);
        const index = group.roleIds.indexOf(roleId);
        if (index > -1) {
            group.roleIds.splice(index, 1);
            await this._saveCallback();
        }
    }

    public async grantPermissionToGroup(
        guildId: string,
        groupKey: string,
        permissionNode: PermissionNode
    ): Promise<void> {
        const group = await this._findGroupOrFail(guildId, groupKey);
        if (!group.permissions.includes(permissionNode)) {
            group.permissions.push(permissionNode);
            await this._saveCallback();
        }
    }

    public async revokePermissionFromGroup(
        guildId: string,
        groupKey: string,
        permissionNode: PermissionNode
    ): Promise<void> {
        const group = await this._findGroupOrFail(guildId, groupKey);
        const index = group.permissions.indexOf(permissionNode);
        if (index > -1) {
            group.permissions.splice(index, 1);
            await this._saveCallback();
        }
    }

    public async setGroupInheritance(
        guildId: string,
        groupKey: string,
        inheritsFrom: string[]
    ): Promise<void> {
        const groups = await this._getGuildPermissionGroups(guildId);
        if (!groups[groupKey]) {
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
        await this._saveCallback();
    }

    private async _getGuildSettings(guildId: string): Promise<IGuildSettings> {
        let settings = this._cache.get(guildId);
        if (!settings) {
            settings = {};
            this._cache.set(guildId, settings);
        }
        return settings;
    }

    private async _getGuildPermissionGroups(
        guildId: string
    ): Promise<Record<string, IPermissionGroup>> {
        const settings = await this._getGuildSettings(guildId);
        if (!settings.permissionGroups) {
            settings.permissionGroups = {};
        }
        return settings.permissionGroups;
    }

    private async _findGroupOrFail(
        guildId: string,
        groupKey: string
    ): Promise<IPermissionGroup> {
        const group = await this.getPermissionGroup(guildId, groupKey);
        if (!group) {
            throw new Error(
                `Группа прав с системным именем "${groupKey}" не найдена.`
            );
        }
        return group;
    }
}
