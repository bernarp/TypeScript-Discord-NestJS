/**
 * @file GroupRevoke.handler.ts
 * @description Обработчик для отзыва разрешения у группы.
 * @version 2.1 (Refactored for new ConfigService)
 * @author System
 */
import { Inject, Injectable } from "@nestjs/common";
import { ChatInputCommandInteraction } from "discord.js";
import { IPermissionSubcommandHandler } from "../../abstractions/IPermissionSubcommandHandler";
import { IPermissionService } from "../../abstractions/IPermissionService";
import { PermissionNode } from "@settings/permissions.dictionary";
import { IConfigurationService } from "@settings/abstractions/IConfigurationService";
import { IEmbedFactory } from "@interfaces/IEmbedFactory";

@Injectable()
export class GroupRevokeHandler implements IPermissionSubcommandHandler {
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

        try {
            await this._configService.permissions.revokePermissionFromGroup(
                interaction.guildId,
                groupKey,
                permission
            );

            this._permissionService.invalidateCache(interaction.guildId);

            const successEmbed = this._embedFactory.createSuccessEmbed({
                description: `Разрешение \`${permission}\` было успешно отозвано у группы \`${groupKey}\`.`,
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
