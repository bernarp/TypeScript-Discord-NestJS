/**
 * @file PermissionService.ts
 * @description Реализация сервиса для проверки прав доступа пользователей.
 * ВЕРСИЯ 2.0: Добавлено кэширование и метод инвалидации кэша.
 */
import { Inject, Injectable, Logger } from "@nestjs/common";
import { GuildMember } from "discord.js";
import { IGuildConfig, IGuildSettings } from "@interface/IGuildConfig";
import { IPermissionService } from "../abstractions/IPermissionService";
import {
    PermissionNode,
    Permissions,
} from "@permissions/permissions.dictionary";
import { ICachedPermissions } from "../abstractions/ICachedPermissions";

@Injectable()
export class PermissionService implements IPermissionService {
    private readonly _logger = new Logger(PermissionService.name);
    private readonly _cache = new Map<string, ICachedPermissions>();
    private readonly CACHE_LIFETIME_MS = 5 * 60 * 1000; // 5 минут

    constructor(
        @Inject("IGuildConfig") private readonly _guildConfig: IGuildConfig
    ) {}

    /**
     * @inheritdoc
     */
    public async check(
        member: GuildMember,
        permission: PermissionNode
    ): Promise<boolean> {
        if (member.permissions.has("Administrator")) {
            return true;
        }

        const resolvedPermissions = await this._resolvePermissions(member);

        if (
            resolvedPermissions.has(Permissions.ADMIN_ALL) ||
            resolvedPermissions.has(permission)
        ) {
            return true;
        }

        const moduleWildcard = (permission.split(".")[0] +
            ".*") as PermissionNode;
        if (resolvedPermissions.has(moduleWildcard)) {
            return true;
        }

        return false;
    }

    /**
     * @method invalidateCache
     * @description Сбрасывает кэш прав для всей гильдии или для конкретного пользователя.
     * @param {string} guildId - ID гильдии, для которой сбрасывается кэш.
     * @param {string} [userId] - Опциональный ID пользователя.
     */
    public invalidateCache(guildId: string, userId?: string): void {
        if (userId) {
            const cacheKey = `${guildId}:${userId}`;
            this._cache.delete(cacheKey);
            this._logger.debug(
                `Cache invalidated for user ${userId} in guild ${guildId}.`
            );
        } else {
            for (const key of this._cache.keys()) {
                if (key.startsWith(`${guildId}:`)) {
                    this._cache.delete(key);
                }
            }
            this._logger.debug(
                `Cache invalidated for entire guild ${guildId}.`
            );
        }
    }

    private async _resolvePermissions(
        member: GuildMember
    ): Promise<Set<PermissionNode>> {
        const cacheKey = `${member.guild.id}:${member.id}`;
        const cached = this._cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.CACHE_LIFETIME_MS) {
            return cached.permissions;
        }

        const guildSettings = await this._guildConfig.getAll(member.guild.id);
        const permissionGroups = guildSettings?.permissionGroups;
        if (!permissionGroups) {
            return new Set();
        }

        const userRoleIds = new Set(member.roles.cache.keys());
        const userGroups: string[] = [];

        for (const groupKey in permissionGroups) {
            const group = permissionGroups[groupKey];
            if (group.roleIds.some((roleId) => userRoleIds.has(roleId))) {
                userGroups.push(groupKey);
            }
        }

        const allPermissions = new Set<PermissionNode>();
        const visitedGroups = new Set<string>();

        for (const groupKey of userGroups) {
            this._collectPermissionsRecursive(
                groupKey,
                permissionGroups,
                allPermissions,
                visitedGroups
            );
        }

        this._cache.set(cacheKey, {
            permissions: allPermissions,
            timestamp: Date.now(),
        });

        return allPermissions;
    }

    private _collectPermissionsRecursive(
        groupKey: string,
        allGroups: NonNullable<IGuildSettings["permissionGroups"]>,
        collected: Set<PermissionNode>,
        visited: Set<string>
    ): void {
        if (visited.has(groupKey)) return;
        visited.add(groupKey);

        const group = allGroups[groupKey];
        if (!group) return;

        for (const permission of group.permissions) {
            collected.add(permission as PermissionNode);
        }

        for (const parentKey of group.inherits) {
            this._collectPermissionsRecursive(
                parentKey,
                allGroups,
                collected,
                visited
            );
        }
    }
}
