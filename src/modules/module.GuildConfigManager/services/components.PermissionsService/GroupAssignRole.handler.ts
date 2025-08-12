/**
 * @file GroupAssignRole.handler.ts
 * @description Обработчик для добавления/удаления роли из группы.
 * @version 2.0: Рефакторинг для использования IConfigurationService.
 */
import { Inject, Injectable } from "@nestjs/common";
import { ChatInputCommandInteraction, Role } from "discord.js";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { IPermissionSubcommandHandler } from "../../abstractions/IPermissionSubcommandHandler";
import { IPermissionService } from "../../abstractions/IPermissionService";
import { IConfigurationService } from "@interface/IConfigurationService";

@Injectable()
export class GroupAssignRoleHandler implements IPermissionSubcommandHandler {
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

        const action = interaction.options.getString("action", true);
        const groupKey = interaction.options.getString("group_key", true);
        const role = interaction.options.getRole("role", true) as Role;

        try {
            if (action === "add") {
                await this._configService.addRoleToGroup(
                    interaction.guildId,
                    groupKey,
                    role.id
                );
            } else {
                await this._configService.removeRoleFromGroup(
                    interaction.guildId,
                    groupKey,
                    role.id
                );
            }

            this._permissionService.invalidateCache(interaction.guildId);

            const successEmbed = this._embedFactory.createSuccessEmbed({
                description: `Роль ${role.toString()} была успешно ${
                    action === "add" ? "добавлена в" : "удалена из"
                } группы \`${groupKey}\`.`,
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
