/**
 * @file PermissionService.ts
 * @description Реализация сервиса для проверки прав доступа пользователей.
 * @version 4.1.0 (Refactored & Finalized)
 * @author System
 */

import { Inject, Injectable } from "@nestjs/common";
import { GuildMember } from "discord.js";
import { IPermissionService } from "../abstractions/IPermissionService";
import {
    PermissionNode,
    Permissions,
} from "@permissions/permissions.dictionary";
import { ICachedPermissions } from "../abstractions/ICachedPermissions";
import { IPermissionRepository } from "@interface/config/repository/IPermissionRepository";
import { ILogger } from "@interface/logger/ILogger";
import { IPermissionGroup } from "@interface/IPermissionGroup";

@Injectable()
export class PermissionService implements IPermissionService {
    private readonly _cache = new Map<string, ICachedPermissions>();
    private readonly CACHE_LIFETIME_MS = 5 * 60 * 1000; // 5 минут

    constructor(
        @Inject("IPermissionRepository")
        private readonly _permissionRepo: IPermissionRepository,
        @Inject("ILogger")
        private readonly _logger: ILogger
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
        if (resolvedPermissions.has(Permissions.ADMIN_ALL)) {
            return true;
        }
        if (resolvedPermissions.has(permission)) {
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
     * @inheritdoc
     */
    public invalidateCache(guildId: string, userId?: string): void {
        if (userId) {
            const cacheKey = `${guildId}:${userId}`;
            if (this._cache.delete(cacheKey)) {
                this._logger.debug(
                    `Permission cache invalidated for user ${userId} in guild ${guildId}.`
                );
            }
        } else {
            let invalidatedCount = 0;
            for (const key of this._cache.keys()) {
                if (key.startsWith(`${guildId}:`)) {
                    this._cache.delete(key);
                    invalidatedCount++;
                }
            }
            if (invalidatedCount > 0) {
                this._logger.debug(
                    `Permission cache invalidated for ${invalidatedCount} users in guild ${guildId}.`
                );
            }
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
        const allGroups = await this._permissionRepo.getAllGroups(
            member.guild.id
        );
        if (!allGroups) {
            return new Set();
        }

        const userRoleIds = new Set(member.roles.cache.keys());
        const userGroupKeys: string[] = [];
        for (const groupKey in allGroups) {
            const group = allGroups[groupKey];
            if (
                group.roleIds.some((roleId: string) => userRoleIds.has(roleId))
            ) {
                userGroupKeys.push(groupKey);
            }
        }

        const allPermissions = new Set<PermissionNode>();
        const visitedGroups = new Set<string>();

        for (const groupKey of userGroupKeys) {
            this._collectPermissionsRecursive(
                groupKey,
                allGroups,
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
        allGroups: Record<string, IPermissionGroup>,
        collected: Set<PermissionNode>,
        visited: Set<string>
    ): void {
        if (visited.has(groupKey)) {
            if (!visited.has(`warned_${groupKey}`)) {
                this._logger.warn(
                    `Circular permission inheritance detected for group: ${groupKey}`
                );
                visited.add(`warned_${groupKey}`);
            }
            return;
        }
        visited.add(groupKey);

        const group = allGroups[groupKey];
        if (!group) return;

        for (const permission of group.permissions) {
            collected.add(permission as PermissionNode);
        }

        if (group.inherits) {
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
}
