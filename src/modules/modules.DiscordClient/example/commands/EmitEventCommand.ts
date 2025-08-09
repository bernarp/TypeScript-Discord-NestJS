/**
 * @file EmitEventCommand.ts
 * @description Команда, которая генерирует событие для демонстрации работы Шины Событий.
 * ВЕРСИЯ 2.0: Упрощена за счет использования глобального Exception Filter.
 */
import { Inject, Injectable } from "@nestjs/common";
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Command } from "@decorators/command.decorator";
import { ICommand } from "@interface/ICommand";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { InteractionCreateEvent } from "@event.EventBus/interaction-create.event";
import { AppEvents } from "@/event.EventBus/app.events";

@Command()
@Injectable()
export class EmitEventCommand implements ICommand {
    public readonly data = new SlashCommandBuilder()
        .setName("emit-event")
        .setDescription(
            "Генерирует тестовое событие, которое будет обработано слушателем."
        );

    public constructor(
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory,
        private readonly _eventEmitter: EventEmitter2
    ) {}

    /**
     * @method execute
     */
    public async execute(interaction: CommandInteraction): Promise<void> {
        this._eventEmitter.emit(
            AppEvents.INTERACTION_CREATED_COMMAND,
            new InteractionCreateEvent(interaction)
        );

        const successEmbed = this._embedFactory.createSuccessEmbed({
            description:
                "Событие `interaction.created` было успешно сгенерировано!",
            context: { user: interaction.user, guild: interaction.guild },
        });

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    }
}
