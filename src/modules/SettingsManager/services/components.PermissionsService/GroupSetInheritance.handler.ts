/**
 * @file GroupSetInheritance.handler.ts
 * @description Обработчик для настройки наследования групп прав.
 * @version 2.1 (Refactored for new ConfigService)
 * @author System
 */
import { Inject, Injectable } from "@nestjs/common";
import { ChatInputCommandInteraction } from "discord.js";
import { IPermissionSubcommandHandler } from "../../abstractions/IPermissionSubcommandHandler";
import { IPermissionService } from "../../abstractions/IPermissionService";
import { IConfigurationService } from "@settings/abstractions/IConfigurationService";
import { IEmbedFactory } from "@interfaces/IEmbedFactory";

@Injectable()
export class GroupSetInheritanceHandler
    implements IPermissionSubcommandHandler
{
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
        const inheritsFromString =
            interaction.options.getString("inherits_from");

        const inheritsFrom = inheritsFromString
            ? inheritsFromString
                  .split(",")
                  .map((key) => key.trim())
                  .filter(Boolean)
            : [];

        try {
            await this._configService.permissions.setGroupInheritance(
                interaction.guildId,
                groupKey,
                inheritsFrom
            );

            this._permissionService.invalidateCache(interaction.guildId);

            const successEmbed = this._embedFactory.createSuccessEmbed({
                title: "Наследование обновлено",
                description: `Группа \`${groupKey}\` теперь наследует права от: ${
                    inheritsFrom.length > 0
                        ? `\`${inheritsFrom.join("`, `")}\``
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
