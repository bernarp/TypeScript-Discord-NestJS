/**
 * @file PermissionGuard.ts
 * @description "Охранник", который проверяет права пользователя перед выполнением команды.
 * @version 2.0: Код не требует изменений благодаря принципу инверсии зависимостей (SOLID).
 * Он зависит от абстракции (IPermissionService), а не от конкретной реализации.
 * Пока реализация (PermissionService) соответствует контракту, этот код будет работать.
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
import { IPermissionService } from "../modules/module.GuildConfigManager/abstractions/IPermissionService";
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

    /**
     * @private
     * @method _checkPermissions
     * @description Выполняет проверку прав в соответствии с указанной логикой (AND/OR).
     */
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
