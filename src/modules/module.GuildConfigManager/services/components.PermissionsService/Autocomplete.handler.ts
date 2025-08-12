/**
 * @file Autocomplete.handler.ts
 * @description Обработчик для автодополнений в команде /permissions.
 * @version 2.0: Рефакторинг для использования IConfigurationService.
 */
import { Inject, Injectable } from "@nestjs/common";
import { AutocompleteInteraction } from "discord.js";
import { IConfigurationService } from "@interface/IConfigurationService";
import { Permissions } from "@permissions/permissions.dictionary";

@Injectable()
export class AutocompleteHandler {
    private readonly _allPermissions: string[];

    constructor(
        @Inject("IConfigurationService")
        private readonly _configService: IConfigurationService
    ) {
        this._allPermissions = Object.values(Permissions);
    }

    public async handle(interaction: AutocompleteInteraction): Promise<void> {
        if (!interaction.inGuild()) return;

        const focusedOption = interaction.options.getFocused(true);
        let choices: { name: string; value: string }[] = [];

        try {
            if (focusedOption.name === "permission") {
                choices = this._getPermissionChoices(focusedOption.value);
            }

            if (
                focusedOption.name === "key" ||
                focusedOption.name === "group_key"
            ) {
                choices = await this._getGroupKeyChoices(
                    interaction.guildId,
                    focusedOption.value
                );
            }

            await interaction.respond(choices);
        } catch (error) {
            console.error("Autocomplete handler failed:", error);
            await interaction.respond([]);
        }
    }

    private _getPermissionChoices(
        query: string
    ): { name: string; value: string }[] {
        const filtered = this._allPermissions.filter((perm) =>
            perm.toLowerCase().includes(query.toLowerCase())
        );

        return filtered
            .slice(0, 25)
            .map((perm) => ({ name: perm, value: perm }));
    }

    private async _getGroupKeyChoices(
        guildId: string,
        query: string
    ): Promise<{ name: string; value: string }[]> {
        const groups = await this._configService.getPermissionGroups(guildId);
        if (!groups) {
            return [];
        }

        const groupKeys = Object.keys(groups);
        const filtered = groupKeys.filter((key) =>
            key.toLowerCase().includes(query.toLowerCase())
        );

        return filtered.slice(0, 25).map((key) => ({
            name: `${groups[key].name} (${key})`, 
            value: key,
        }));
    }
}
