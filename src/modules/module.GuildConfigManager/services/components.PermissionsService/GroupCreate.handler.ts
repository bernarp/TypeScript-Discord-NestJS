/**
 * @file GroupCreate.handler.ts
 * @description Обработчик для создания новой группы прав.
 */
import { Inject, Injectable } from "@nestjs/common"; 
import { ChatInputCommandInteraction } from "discord.js";
import { IGuildConfig } from "@interface/IGuildConfig";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { IPermissionSubcommandHandler } from "../../abstractions/IPermissionSubcommandHandler";

@Injectable() 
export class GroupCreateHandler implements IPermissionSubcommandHandler {
    constructor(
        @Inject("IGuildConfig") private readonly _guildConfig: IGuildConfig,
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory
    ) {}

    public async execute(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
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
            await this._guildConfig.createPermissionGroup(
                interaction.guildId!,
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
