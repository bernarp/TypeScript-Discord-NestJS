import { PermissionNode } from "@/core.DiscordClient/domain/permissions.DiscordClient/permissions.dictionary";

export interface ICachedPermissions {
    permissions: Set<PermissionNode>;
    timestamp: number;
}
