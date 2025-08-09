/**
 * @file EmitEventCommand.ts
 * @description Команда, которая генерирует событие для демонстрации работы Шины Событий.
 */
import { Inject, Injectable } from "@nestjs/common";
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Command } from "@decorators/command.decorator";
import { ICommand } from "@interface/ICommand";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { InteractionCreateEvent } from "@event.EventBus/interaction-create.event";

@Command()
@Injectable()
export class EmitEventCommand implements ICommand {
    public readonly data = new SlashCommandBuilder()
        .setName("emit-event-tests")
        .setDescription(
            "Генерирует тестовое событие, которое будет обработано слушателем."
        );

    /**
     * @constructor
     * @param _embedFactory - Фабрика для создания эмбедов.
     * @param _eventEmitter - Шина Событий для генерации событий.
     */
    public constructor(
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory,
        private readonly _eventEmitter: EventEmitter2
    ) {}

    public async execute(interaction: CommandInteraction): Promise<void> {

        this._eventEmitter.emit(
            "interaction.created",
            new InteractionCreateEvent(interaction)
        );

        const successEmbed = this._embedFactory.createSuccessEmbed({
            description:
                "Событие `interaction.created` было успешно сгенерировано!",
            context: { user: interaction.user },
        });

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    }
}
