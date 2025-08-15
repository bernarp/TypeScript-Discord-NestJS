/**
 * @file guild-config.module.ts
 * @description Модуль для управления командой /config.
 */
import { Module } from "@nestjs/common";
import { CoreModule } from "@/core.module";
import { ConfigCommand } from "./commands/ConfigCommand";
import { PermissionService } from "./services/PermissionService";
import { PermissionsCommand } from "./commands/PermissionsCommand";
import { GroupAssignRoleHandler } from "./services/components.PermissionsService/GroupAssignRole.handler";
import { GroupCreateHandler } from "./services/components.PermissionsService/GroupCreate.handler";
import { GroupDeleteHandler } from "./services/components.PermissionsService/GroupDelete.handler";
import { GroupGrantHandler } from "./services/components.PermissionsService/GroupGrant.handler";
import { GroupRevokeHandler } from "./services/components.PermissionsService/GroupRevoke.handler";
import { AutocompleteHandler } from "./services/components.PermissionsService/Autocomplete.handler";
import { GroupSetInheritanceHandler } from "./services/components.PermissionsService/GroupSetInheritance.handler";
import { PinnedMessageCommand } from "./commands/PinnedMessageCommand";

@Module({
    imports: [CoreModule],
    providers: [
        GroupAssignRoleHandler,
        GroupCreateHandler,
        GroupDeleteHandler,
        GroupGrantHandler,
        GroupRevokeHandler,
        ConfigCommand,
        PermissionsCommand,
        PermissionService,
        AutocompleteHandler,
        GroupSetInheritanceHandler,
        PinnedMessageCommand,
        {
            provide: "IPermissionService",
            useClass: PermissionService,
        },
    ],
    exports: ["IPermissionService"],
})
export class GuildConfigModule {}
