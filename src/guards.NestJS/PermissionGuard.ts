/**
 * @file PermissionGuard.ts
 * @description "Охранник", который проверяет права пользователя перед выполнением команды.
 * ВЕРСИЯ 3.0: Добавлена поддержка логики AND/OR.
 */
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    Inject,
    Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CommandInteraction, GuildMember } from "discord.js";
import { IPermissionService } from "@/modules/module.GuildConfigManager/abstractions/IPermissionService";
import {
    PERMISSIONS_METADATA_KEY,
    PermissionRequirements,
} from "@decorators/requiresPermission.decorator";

@Injectable()
export class PermissionGuard implements CanActivate {
    private readonly _logger = new Logger(PermissionGuard.name);

    constructor(
        private readonly _reflector: Reflector,
        @Inject("IPermissionService")
        private readonly _permissionService: IPermissionService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requirements = this._reflector.get<PermissionRequirements>(
            PERMISSIONS_METADATA_KEY,
            context.getHandler()
        );

        const interaction = context.getArgByIndex<CommandInteraction>(0);
        const commandName = interaction?.commandName || "unknown command";
        const member = interaction?.member as GuildMember;

        const logContext = {
            command: commandName,
            user: member ? `${member.user.tag} (${member.id})` : "unknown user",
            guild: member ? member.guild.id : "unknown guild",
        };

        this._logger.debug(
            `Initiating permission check for command /${commandName}...`,
            logContext
        );

        if (!requirements || requirements.permissions.length === 0) {
            this._logger.debug(
                `No @RequiresPermission decorator found. Access granted by default.`,
                logContext
            );
            return true;
        }

        this._logger.debug(
            `Required permissions (Logic: ${
                requirements.logic
            }): [${requirements.permissions.join(", ")}]`,
            logContext
        );

        if (!interaction?.inGuild() || !member) {
            this._logger.warn(
                "PermissionGuard was used on an interaction without a guild or member. Access denied.",
                logContext
            );
            return false;
        }

        const hasPermission = await this._checkPermissions(
            member,
            requirements,
            logContext
        );

        if (!hasPermission) {
            this._logger.warn(
                `Access denied. User does not meet the required permissions.`,
                logContext
            );
        }

        return hasPermission;
    }

    /**
     * @private
     * @method _checkPermissions
     * @description Выполняет проверку прав в соответствии с указанной логикой.
     */
    private async _checkPermissions(
        member: GuildMember,
        requirements: PermissionRequirements,
        logContext: Record<string, string>
    ): Promise<boolean> {
        if (requirements.logic === "OR") {
            for (const permission of requirements.permissions) {
                this._logger.debug(
                    `Checking for permission: "${permission}"...`,
                    logContext
                );
                if (await this._permissionService.check(member, permission)) {
                    this._logger.debug(
                        `Permission "${permission}" found for user. Access granted.`,
                        logContext
                    );
                    return true;
                }
            }
            return false;
        } else {
            for (const permission of requirements.permissions) {
                this._logger.debug(
                    `Checking for required permission: "${permission}"...`,
                    logContext
                );
                if (
                    !(await this._permissionService.check(member, permission))
                ) {
                    this._logger.debug(
                        `Required permission "${permission}" NOT found for user. Access denied.`,
                        logContext
                    );
                    return false;
                }
                this._logger.debug(
                    `Required permission "${permission}" found.`,
                    logContext
                );
            }
            this._logger.debug(
                `All required permissions found for user. Access granted.`,
                logContext
            );
            return true;
        }
    }
}
