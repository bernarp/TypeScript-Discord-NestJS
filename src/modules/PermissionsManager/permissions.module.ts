import { Module } from "@nestjs/common";
import { CoreModule } from "@core/core.module";
import { PermissionService } from "@permissions/services/permission.service";
import { PermissionsCommand } from "@permissions/commands/PermissionsCommand";
import { AutocompleteHandler } from "@permissions/handlers/Autocomplete.handler";
import { GroupAssignRoleHandler } from "@permissions/handlers/GroupAssignRole.handler";
import { GroupCreateHandler } from "@permissions/handlers/GroupCreate.handler";
import { GroupDeleteHandler } from "@permissions/handlers/GroupDelete.handler";
import { GroupGrantHandler } from "@permissions/handlers/GroupGrant.handler";
import { GroupRevokeHandler } from "@permissions/handlers/GroupRevoke.handler";
import { GroupSetInheritanceHandler } from "@permissions/handlers/GroupSetInheritance.handler";

@Module({
    imports: [CoreModule],
    providers: [
        {
            provide: "IPermissionService",
            useClass: PermissionService,
        },
        PermissionsCommand,
        AutocompleteHandler,
        GroupAssignRoleHandler,
        GroupCreateHandler,
        GroupDeleteHandler,
        GroupGrantHandler,
        GroupRevokeHandler,
        GroupSetInheritanceHandler,
    ],
    exports: ["IPermissionService"],
})
export class PermissionsModule {}
