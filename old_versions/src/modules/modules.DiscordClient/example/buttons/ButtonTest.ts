// src/modules/module.DiscordClient/example/commands/ButtonTestCommand.ts

import { Inject, Injectable } from "@nestjs/common";
import {
    CommandInteraction,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";
import { Command } from "@decorators/command.decorator";
import { ICommand } from "@interface/ICommand";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { DeleteMessageButtonHandler } from "../buttons/handlers/DeleteMessageButton.handler";
import { CustomIds } from "@/core.DiscordClient/abstractions/enum/CustomIds";

@Injectable()
@Command()
export class ButtonTestCommand implements ICommand {
    public readonly data = new SlashCommandBuilder()
        .setName("button-test")
        .setDescription("Отправляет тестовое сообщение с кнопкой.");

    constructor(
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory
    ) {}

    public async execute(interaction: CommandInteraction): Promise<void> {
        if (!interaction.isChatInputCommand()) return;

        const deleteButton = new ButtonBuilder()
            .setCustomId(CustomIds.DELETE_TEST_MESSAGE_BUTTON)
            .setLabel("Удалить это сообщение")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗑️");

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            deleteButton
        );

        const embed = this._embedFactory.createInfoEmbed({
            title: "Тестирование кнопок",
            description: "Нажмите на кнопку ниже, чтобы удалить это сообщение.",
            context: { user: interaction.user, guild: interaction.guild },
        });

        await interaction.reply({
            embeds: [embed],
            components: [row],
        });
    }
}
