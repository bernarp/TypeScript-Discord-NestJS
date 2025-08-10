/**
 * @file Autocomplete.handler.ts
 * @description Обработчик для автодополнения в команде /permissions.
 */
import { Inject, Injectable } from "@nestjs/common";
import { AutocompleteInteraction } from "discord.js";
import { IGuildConfig } from "@interface/IGuildConfig";
import { Permissions } from "@permissions/permissions.dictionary";

@Injectable()
export class AutocompleteHandler {
    private readonly _allPermissions: string[];

    constructor(
        @Inject("IGuildConfig") private readonly _guildConfig: IGuildConfig
    ) {
        this._allPermissions = Object.values(Permissions);
    }

    public async handle(interaction: AutocompleteInteraction): Promise<void> {
        const focusedOption = interaction.options.getFocused(true);

        let choices: { name: string; value: string }[] = [];

        if (focusedOption.name === "permission") {
            choices = this._getPermissionChoices(focusedOption.value);
        }

        if (
            focusedOption.name === "key" ||
            focusedOption.name === "group_key"
        ) {
            choices = await this._getGroupKeyChoices(
                interaction.guildId!,
                focusedOption.value
            );
        }

        await interaction.respond(choices);
    }

    /**
     * @private
     * @method _getPermissionChoices
     * @description Фильтрует и возвращает список прав для автодополнения.
     */
    private _getPermissionChoices(
        query: string
    ): { name: string; value: string }[] {
        const filtered = this._allPermissions.filter((perm) =>
            perm.toLowerCase().startsWith(query.toLowerCase())
        );

        return filtered
            .slice(0, 25)
            .map((perm) => ({ name: perm, value: perm }));
    }

    /**
     * @private
     * @method _getGroupKeyChoices
     * @description Фильтрует и возвращает список ключей групп для автодополнения.
     */
    private async _getGroupKeyChoices(
        guildId: string,
        query: string
    ): Promise<{ name: string; value: string }[]> {
        const groups = await this._guildConfig.getPermissionGroups(guildId);
        if (!groups) {
            return [];
        }

        const groupKeys = Object.keys(groups);
        const filtered = groupKeys.filter((key) =>
            key.toLowerCase().startsWith(query.toLowerCase())
        );

        return filtered.slice(0, 25).map((key) => ({
            name: `${groups[key].name} (${key})`,
            value: key,
        }));
    }
}

