/**
 * @file GroupSetInheritance.handler.ts
 * @description Обработчик для настройки наследования групп прав.
 */
import { Inject, Injectable } from "@nestjs/common";
import { ChatInputCommandInteraction } from "discord.js";
import { IGuildConfig } from "@interface/IGuildConfig";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { IPermissionSubcommandHandler } from "../../abstractions/IPermissionSubcommandHandler";
import { IPermissionService } from "../../abstractions/IPermissionService";

@Injectable()
export class GroupSetInheritanceHandler
    implements IPermissionSubcommandHandler
{
    constructor(
        @Inject("IGuildConfig") private readonly _guildConfig: IGuildConfig,
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory,
        @Inject("IPermissionService")
        private readonly _permissionService: IPermissionService
    ) {}

    public async execute(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        const groupKey = interaction.options.getString("group_key", true);
        const inheritsFrom =
            interaction.options.getString("inherits_from")?.split(",") || [];

        const cleanedInherits = inheritsFrom
            .map((key) => key.trim())
            .filter(Boolean);

        try {
            await this._guildConfig.setGroupInheritance(
                interaction.guildId!,
                groupKey,
                cleanedInherits
            );

            this._permissionService.invalidateCache(interaction.guildId!);

            const successEmbed = this._embedFactory.createSuccessEmbed({
                title: "Наследование обновлено",
                description: `Группа \`${groupKey}\` теперь наследует права от: ${
                    cleanedInherits.length > 0
                        ? `\`${cleanedInherits.join("`, `")}\``
                        : "*Никого*"
                }.`,
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
