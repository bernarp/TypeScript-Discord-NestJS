import { PermissionNode } from "@settings/permissions.dictionary";

export interface ICachedPermissions {
    permissions: Set<PermissionNode>;
    timestamp: number;
}
