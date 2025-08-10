/**
 * @file GroupDelete.handler.ts
 * @description Обработчик для удаления группы прав.
 */
import { Inject, Injectable } from "@nestjs/common"; 
import { ChatInputCommandInteraction } from "discord.js";
import { IGuildConfig } from "@interface/IGuildConfig";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { IPermissionSubcommandHandler } from "../../abstractions/IPermissionSubcommandHandler";
import { IPermissionService } from "../../abstractions/IPermissionService";

@Injectable() 
export class GroupDeleteHandler implements IPermissionSubcommandHandler {
    constructor(
        @Inject("IGuildConfig") private readonly _guildConfig: IGuildConfig,
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory,
        @Inject("IPermissionService")
        private readonly _permissionService: IPermissionService
    ) {}

    public async execute(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        const groupKey = interaction.options.getString("key", true);

        try {
            const group = await this._guildConfig.getPermissionGroup(
                interaction.guildId!,
                groupKey
            );
            if (!group) throw new Error(`Группа \`${groupKey}\` не найдена.`);

            await this._guildConfig.deletePermissionGroup(
                interaction.guildId!,
                groupKey
            );

            this._permissionService.invalidateCache(interaction.guildId!);

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
