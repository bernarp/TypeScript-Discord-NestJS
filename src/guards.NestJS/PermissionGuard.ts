/**
 * @file PermissionGuard.ts
 * @description "Стражник", который проверяет права пользователя перед выполнением команды.
 * @version 2.1: Рефакторинг для использования кастомного ILogger.
 */
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    Inject,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CommandInteraction, GuildMember } from "discord.js";
import { IPermissionService } from "../modules/module.GuildConfigManager/abstractions/IPermissionService";
import {
    PERMISSIONS_METADATA_KEY,
    PermissionRequirements,
} from "@decorators/requiresPermission.decorator";
import { ILogger } from "@logger/";

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private readonly _reflector: Reflector,
        @Inject("IPermissionService")
        private readonly _permissionService: IPermissionService,
        @Inject("ILogger") private readonly _logger: ILogger
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requirements = this._reflector.get<PermissionRequirements>(
            PERMISSIONS_METADATA_KEY,
            context.getHandler()
        );

        if (!requirements || requirements.permissions.length === 0) {
            return true;
        }

        const interaction = context.getArgByIndex<CommandInteraction>(0);
        const member = interaction?.member as GuildMember;

        if (!interaction?.inGuild() || !member) {
            this._logger.warn(
                "PermissionGuard was used on an interaction without a guild or member. Access denied."
            );
            return false;
        }

        const commandName = interaction?.commandName || "unknown command";
        const logContext = {
            command: commandName,
            user: `${member.user.tag} (${member.id})`,
            guild: member.guild.id,
        };

        this._logger.debug(
            `Initiating permission check for command /${commandName}...`,
            logContext
        );
        this._logger.debug(
            `Required permissions (Logic: ${
                requirements.logic
            }): [${requirements.permissions.join(", ")}]`,
            logContext
        );

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
        } else {
            this._logger.debug("Access granted.", logContext);
        }

        return hasPermission;
    }

    private async _checkPermissions(
        member: GuildMember,
        requirements: PermissionRequirements,
        logContext: Record<string, string>
    ): Promise<boolean> {
        if (requirements.logic === "OR") {
            for (const permission of requirements.permissions) {
                if (await this._permissionService.check(member, permission)) {
                    this._logger.debug(
                        `Permission "${permission}" found (OR logic).`,
                        logContext
                    );
                    return true;
                }
            }
            return false;
        } else {
            for (const permission of requirements.permissions) {
                if (
                    !(await this._permissionService.check(member, permission))
                ) {
                    this._logger.debug(
                        `Required permission "${permission}" NOT found (AND logic).`,
                        logContext
                    );
                    return false;
                }
            }
            return true;
        }
    }
}
