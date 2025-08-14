/**
 * @file PermissionsCommand.ts
 * @description Команда для управления системой прав доступа.
 * @version 6.1 (Refactored for new ConfigService)
 * @author System
 */
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import {
    SlashCommandBuilder,
    CommandInteraction,
    ChatInputCommandInteraction,
    AutocompleteInteraction,
    GuildMember,
} from "discord.js";
import { Command } from "@decorators/command.decorator";
import { ICommand } from "@interface/ICommand";
import {
    Permissions,
    PermissionNode,
} from "@permissions/permissions.dictionary";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { IPermissionSubcommandHandler } from "../abstractions/IPermissionSubcommandHandler";
import { GroupCreateHandler } from "../services/components.PermissionsService/GroupCreate.handler";
import { GroupDeleteHandler } from "../services/components.PermissionsService/GroupDelete.handler";
import { GroupAssignRoleHandler } from "../services/components.PermissionsService/GroupAssignRole.handler";
import { GroupGrantHandler } from "../services/components.PermissionsService/GroupGrant.handler";
import { GroupRevokeHandler } from "../services/components.PermissionsService/GroupRevoke.handler";
import { AutocompleteHandler } from "../services/components.PermissionsService/Autocomplete.handler";
import { IPermissionService } from "../abstractions/IPermissionService";
import { GroupSetInheritanceHandler } from "../services/components.PermissionsService/GroupSetInheritance.handler";
import { IConfigurationService } from "@interface/config/IConfigurationService";

@Command()
@Injectable()
export class PermissionsCommand implements ICommand, OnModuleInit {
    public readonly data = new SlashCommandBuilder()
        .setName("permissions")
        .setDescription("Управляет системой прав доступа на сервере.")
        .setDMPermission(false)
        .addSubcommandGroup((group) =>
            group
                .setName("group")
                .setDescription("Управление группами прав")
                .addSubcommand((sub) =>
                    sub
                        .setName("create")
                        .setDescription("Создает новую группу прав.")
                        .addStringOption((opt) =>
                            opt
                                .setName("key")
                                .setDescription(
                                    "Системное имя (ключ) группы (например, 'moderators')."
                                )
                                .setRequired(true)
                        )
                        .addStringOption((opt) =>
                            opt
                                .setName("name")
                                .setDescription(
                                    "Отображаемое имя группы (например, 'Модераторы')."
                                )
                                .setRequired(true)
                        )
                )
                .addSubcommand((sub) =>
                    sub
                        .setName("delete")
                        .setDescription("Удаляет группу прав.")
                        .addStringOption((opt) =>
                            opt
                                .setName("key")
                                .setDescription("Системное имя группы.")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand((sub) =>
                    sub
                        .setName("assign-role")
                        .setDescription("Добавляет или удаляет роль из группы.")
                        .addStringOption((opt) =>
                            opt
                                .setName("action")
                                .setDescription(
                                    "Действие: добавить или удалить."
                                )
                                .setRequired(true)
                                .addChoices(
                                    { name: "Добавить", value: "add" },
                                    { name: "Удалить", value: "remove" }
                                )
                        )
                        .addStringOption((opt) =>
                            opt
                                .setName("group_key")
                                .setDescription("Системное имя группы.")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                        .addRoleOption((opt) =>
                            opt
                                .setName("role")
                                .setDescription("Роль для добавления/удаления.")
                                .setRequired(true)
                        )
                )
                .addSubcommand((sub) =>
                    sub
                        .setName("grant")
                        .setDescription("Выдает разрешение группе.")
                        .addStringOption((opt) =>
                            opt
                                .setName("group_key")
                                .setDescription("Системное имя группы.")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                        .addStringOption((opt) =>
                            opt
                                .setName("permission")
                                .setDescription("Разрешение для выдачи.")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand((sub) =>
                    sub
                        .setName("revoke")
                        .setDescription("Отзывает разрешение у группы.")
                        .addStringOption((opt) =>
                            opt
                                .setName("group_key")
                                .setDescription("Системное имя группы.")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                        .addStringOption((opt) =>
                            opt
                                .setName("permission")
                                .setDescription("Разрешение для отзыва.")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand((sub) =>
                    sub
                        .setName("set-inheritance")
                        .setDescription("Настраивает наследование для группы.")
                        .addStringOption((opt) =>
                            opt
                                .setName("group_key")
                                .setDescription(
                                    "Группа, которую вы настраиваете."
                                )
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                        .addStringOption((opt) =>
                            opt
                                .setName("inherits_from")
                                .setDescription(
                                    "Системные имена групп-родителей через запятую."
                                )
                                .setRequired(false)
                        )
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("view")
                .setDescription("Показывает текущую конфигурацию прав.")
        );

    private readonly _subcommandHandlers = new Map<
        string,
        IPermissionSubcommandHandler
    >();

    private readonly _permissionMap = new Map<string, PermissionNode>([
        ["create", Permissions.PERMISSIONS_GROUP_CREATE],
        ["delete", Permissions.PERMISSIONS_GROUP_DELETE],
        ["assign-role", Permissions.PERMISSIONS_GROUP_ASSIGN_ROLE],
        ["grant", Permissions.PERMISSIONS_GROUP_GRANT],
        ["revoke", Permissions.PERMISSIONS_GROUP_GRANT],
        ["set-inheritance", Permissions.PERMISSIONS_GROUP_SET_INHERITANCE],
        ["view", Permissions.PERMISSIONS_VIEW],
    ]);

    constructor(
        @Inject("IEmbedFactory")
        private readonly _embedFactory: IEmbedFactory,
        @Inject("IConfigurationService")
        private readonly _configService: IConfigurationService,
        @Inject("IPermissionService")
        private readonly _permissionService: IPermissionService,
        private readonly _groupCreateHandler: GroupCreateHandler,
        private readonly _groupDeleteHandler: GroupDeleteHandler,
        private readonly _groupAssignRoleHandler: GroupAssignRoleHandler,
        private readonly _groupGrantHandler: GroupGrantHandler,
        private readonly _groupRevokeHandler: GroupRevokeHandler,
        private readonly _autocompleteHandler: AutocompleteHandler,
        private readonly _groupSetInheritanceHandler: GroupSetInheritanceHandler
    ) {}

    public onModuleInit() {
        this._subcommandHandlers.set("create", this._groupCreateHandler);
        this._subcommandHandlers.set("delete", this._groupDeleteHandler);
        this._subcommandHandlers.set(
            "assign-role",
            this._groupAssignRoleHandler
        );
        this._subcommandHandlers.set("grant", this._groupGrantHandler);
        this._subcommandHandlers.set("revoke", this._groupRevokeHandler);
        this._subcommandHandlers.set(
            "set-inheritance",
            this._groupSetInheritanceHandler
        );
    }

    public async execute(
        interaction: CommandInteraction | AutocompleteInteraction
    ): Promise<void> {
        if (interaction.isAutocomplete()) {
            await this._autocompleteHandler.handle(interaction);
        } else if (interaction.isChatInputCommand()) {
            await this._handleChatInputCommand(interaction);
        }
    }

    private async _handleChatInputCommand(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        if (!interaction.inGuild()) return;

        const subcommand = interaction.options.getSubcommand();
        const requiredPermission = this._permissionMap.get(subcommand);

        if (
            !requiredPermission ||
            !(await this._permissionService.check(
                interaction.member as GuildMember,
                requiredPermission
            ))
        ) {
            const errorEmbed = this._embedFactory.createErrorEmbed({
                description:
                    "У вас недостаточно прав для выполнения этого действия.",
                context: { user: interaction.user, guild: interaction.guild },
            });
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        if (subcommand === "view") {
            await this._handleView(interaction);
            return;
        }

        const handler = this._subcommandHandlers.get(subcommand);
        if (handler) {
            await handler.execute(interaction);
        } else {
            throw new Error(`No handler found for subcommand: ${subcommand}`);
        }
    }

    private async _handleView(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        const groups = await this._configService.permissions.getAllGroups(
            interaction.guildId!
        );

        if (!groups || Object.keys(groups).length === 0) {
            const embed = this._embedFactory.createInfoEmbed({
                title: "Конфигурация прав доступа",
                description:
                    "На этом сервере еще не создано ни одной группы прав.",
                context: { user: interaction.user, guild: interaction.guild },
            });
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const embed = this._embedFactory.createInfoEmbed({
            title: "Конфигурация прав доступа",
            description: `Настройки для сервера "${interaction.guild?.name}"`,
            context: { user: interaction.user, guild: interaction.guild },
        });

        for (const key in groups) {
            const group = groups[key];
            const roles =
                group.roleIds.map((id) => `<@&${id}>`).join(", ") ||
                "*Нет ролей*";
            const perms =
                group.permissions.map((p) => `\`${p}\``).join(", ") ||
                "*Нет прав*";
            const inherits =
                group.inherits.map((i) => `**${i}**`).join(", ") ||
                "*Не наследуется*";

            embed.addFields({
                name: `Группа: ${group.name} (\`${key}\`)`,
                value: `**Роли:** ${roles}\n**Права:** ${perms}\n**Наследует:** ${inherits}`,
            });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}
