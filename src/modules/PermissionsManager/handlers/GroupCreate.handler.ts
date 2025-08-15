/**
 * @file GroupCreate.handler.ts
 * @description Обработчик для создания новой группы прав.
 * @version 2.1 (Refactored for new ConfigService)
 * @author System
 */
import { Inject, Injectable } from "@nestjs/common";
import { ChatInputCommandInteraction } from "discord.js";
import { IPermissionSubcommandHandler } from "@permissions/interfaces/IPermissionSubcommandHandler";
import { IConfigurationService } from "@settings/abstractions/IConfigurationService";
import { IEmbedFactory } from "@interfaces/IEmbedFactory";

@Injectable()
export class GroupCreateHandler implements IPermissionSubcommandHandler {
    constructor(
        @Inject("IConfigurationService")
        private readonly _configService: IConfigurationService,
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory
    ) {}

    public async execute(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        if (!interaction.inGuild()) return;

        const groupKey = interaction.options
            .getString("key", true)
            .toLowerCase();
        const groupName = interaction.options.getString("name", true);

        if (!/^[a-z0-9_]{3,32}$/.test(groupKey)) {
            const errorEmbed = this._embedFactory.createErrorEmbed({
                description:
                    "Системное имя может содержать только строчные латинские буквы, цифры и `_`, длина от 3 до 32 символов.",
                context: { user: interaction.user, guild: interaction.guild },
            });
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        try {
            await this._configService.permissions.createGroup(
                interaction.guildId,
                groupKey,
                groupName
            );

            const successEmbed = this._embedFactory.createSuccessEmbed({
                title: "Группа прав создана",
                description: `Новая группа **${groupName}** (\`${groupKey}\`) была успешно создана.`,
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
