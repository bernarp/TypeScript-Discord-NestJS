/**
 * @file EmitEventCommand.ts
 * @description Команда, которая генерирует событие для демонстрации работы Шины Событий.
 * ВЕРСИЯ 4.0: Использует универсальный декоратор @EmitEvent.
 */
import { Inject, Injectable } from "@nestjs/common";
import {
    CommandInteraction,
    SlashCommandBuilder,
    ChatInputCommandInteraction,
} from "discord.js";
import { Command } from "@decorators/command.decorator";
import { ICommand } from "@interactions/interfaces/ICommand";
import { IEmbedFactory } from "@interfaces/IEmbedFactory";


@Command()
@Injectable()
export class EmitEventCommand implements ICommand {
    public readonly data = new SlashCommandBuilder()
        .setName("emit-event")
        .setDescription(
            "Генерирует тестовое событие, которое будет обработано слушателем."
        );

    public constructor(
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory
    ) {}

    public async execute(interaction: CommandInteraction): Promise<void> {
        if (!interaction.isChatInputCommand()) return;
        
        
        const successEmbed = this._embedFactory.createSuccessEmbed({
            description:
                "Событие `interaction.created` было успешно сгенерировано универсальным перехватчиком!",
            context: { user: interaction.user, guild: interaction.guild },
        });

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    }
}
