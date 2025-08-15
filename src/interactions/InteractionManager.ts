/**
 * @file InteractionManager.ts
 * @description Центральный диспетчер, который получает все взаимодействия и
 * делегирует их обработку специализированным обработчикам.
 * @version 1.1: Рефакторинг для использования кастомного ILogger.
 */
import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Interaction } from "discord.js";
import { InteractionCreateEvent } from "@events/interaction-create.eventv2";
import { IInteractionHandler } from "@interactions/interfaces/IInteractionHandler";
import { CommandHandler } from "@interactions/Command.handler";
import { AppEvents } from "@events/app.events";
import { ILogger } from "@logger";
import { ButtonManager } from "@interactions/Button.handler";

@Injectable()
export class InteractionManager {
    private readonly _handlers: IInteractionHandler[];

    constructor(
        buttonManager: ButtonManager,
        commandHandler: CommandHandler,
        @Inject("ILogger") private readonly _logger: ILogger // Стало
    ) {
        this._handlers = [commandHandler, buttonManager];
    }

    @OnEvent(AppEvents.INTERACTION_CREATED)
    public async onInteractionCreate(
        payload: InteractionCreateEvent<Interaction>
    ): Promise<void> {
        const { interaction } = payload;

        for (const handler of this._handlers) {
            if (handler.supports(interaction)) {
                this._logger.debug(
                    `Interaction of type "${interaction.type}" is being handled by "${handler.constructor.name}".`
                );
                try {
                    await handler.handle(interaction);
                } catch (error) {
                    this._logger.err(
                        `Handler "${handler.constructor.name}" failed to process interaction:`,
                        error.stack
                    );
                }
                return;
            }
        }

        this._logger.warn(
            `No handler found for interaction of type "${interaction.type}" (ID: ${interaction.id}).`
        );
    }
}
