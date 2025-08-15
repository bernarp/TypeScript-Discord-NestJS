/**
 * @file GroupGrant.handler.ts
 * @description Обработчик для выдачи разрешения группе.
 * @version 2.1 (Refactored for new ConfigService)
 * @author System
 */
import { Inject, Injectable } from "@nestjs/common";
import { ChatInputCommandInteraction } from "discord.js";
import { IEmbedFactory } from "@interfaces/IEmbedFactory";
import { IPermissionSubcommandHandler } from "@permissions/interfaces/IPermissionSubcommandHandler";
import { IPermissionService } from "@permissions/interfaces/IPermissionService";
import {
    Permissions,
    PermissionNode,
} from "@permissions/permissions.dictionary";
import { IConfigurationService } from "@settings/abstractions/IConfigurationService";

@Injectable()
export class GroupGrantHandler implements IPermissionSubcommandHandler {
    constructor(
        @Inject("IConfigurationService")
        private readonly _configService: IConfigurationService,
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory,
        @Inject("IPermissionService")
        private readonly _permissionService: IPermissionService
    ) {}

    public async execute(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        if (!interaction.inGuild()) return;

        const groupKey = interaction.options.getString("group_key", true);
        const permission = interaction.options.getString(
            "permission",
            true
        ) as PermissionNode;

        if (!Object.values(Permissions).includes(permission)) {
            const errorEmbed = this._embedFactory.createErrorEmbed({
                description: `Разрешение \`${permission}\` не существует в системе.`,
                context: { user: interaction.user, guild: interaction.guild },
            });
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        try {
            await this._configService.permissions.grantPermissionToGroup(
                interaction.guildId,
                groupKey,
                permission
            );

            this._permissionService.invalidateCache(interaction.guildId);

            const successEmbed = this._embedFactory.createSuccessEmbed({
                description: `Разрешение \`${permission}\` было успешно выдано группе \`${groupKey}\`.`,
                context: { user: interaction.user, guild: interaction.guild },
            });
            await interaction.reply({
                embeds: [successEmbed],
                ephemeral: true,
            });
        } catch (error) {
            const errorEmbed = this._embedFactory.createErrorEmbed({
                description: error.message,
                context: { user: interaction.user, guild: interaction.guild },
            });
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}
