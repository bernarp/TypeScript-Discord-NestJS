import { PermissionNode } from "@permissions/permissions.dictionary";

export interface ICachedPermissions {
    permissions: Set<PermissionNode>;
    timestamp: number;
}
