/**
 * @file Autocomplete.handler.ts
 * @description Обработчик для автодополнений в команде /permissions.
 * @version 2.1 (Refactored for new ConfigService)
 * @author System
 */
import { Inject, Injectable } from "@nestjs/common";
import { AutocompleteInteraction } from "discord.js";
import { IConfigurationService } from "@settings/abstractions/IConfigurationService";
import { Permissions } from "@permissions/permissions.dictionary";
import { ILogger } from "@logger";

@Injectable()
export class AutocompleteHandler {
    private readonly _allPermissions: string[];

    constructor(
        @Inject("IConfigurationService")
        private readonly _configService: IConfigurationService,
        @Inject("ILogger")
        private readonly _logger: ILogger
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
            this._logger.err("Autocomplete handler failed:", error.stack);
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
        const groups = await this._configService.permissions.getAllGroups(
            guildId
        );
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
