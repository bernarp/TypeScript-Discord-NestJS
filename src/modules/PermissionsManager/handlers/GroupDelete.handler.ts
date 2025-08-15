/**
 * @file GroupDelete.handler.ts
 * @description Обработчик для удаления группы прав.
 * @version 2.1 (Refactored for new ConfigService)
 * @author System
 */
import { Inject, Injectable } from "@nestjs/common";
import { ChatInputCommandInteraction } from "discord.js";
import { IPermissionSubcommandHandler } from "@permissions/interfaces/IPermissionSubcommandHandler";
import { IPermissionService } from "@permissions/interfaces/IPermissionService";
import { IConfigurationService } from "@settings/abstractions/IConfigurationService";
import { IEmbedFactory } from "@interfaces/IEmbedFactory";

@Injectable()
export class GroupDeleteHandler implements IPermissionSubcommandHandler {
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

        const groupKey = interaction.options.getString("key", true);

        try {
            const group = await this._configService.permissions.getGroup(
                interaction.guildId,
                groupKey
            );
            if (!group) throw new Error(`Группа \`${groupKey}\` не найдена.`);

            await this._configService.permissions.deleteGroup(
                interaction.guildId,
                groupKey
            );

            this._permissionService.invalidateCache(interaction.guildId);

            const successEmbed = this._embedFactory.createSuccessEmbed({
                title: "Группа прав удалена",
                description: `Группа **${group.name}** (\`${groupKey}\`) была успешно удалена.`,
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
