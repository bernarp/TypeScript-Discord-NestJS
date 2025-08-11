/**
 * @file InteractionManager.ts
 * @description Центральный диспетчер, который получает все взаимодействия и
 * делегирует их обработку специализированным обработчикам.
 */
import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Interaction } from "discord.js";
import { InteractionCreateEvent } from "@event.EventBus/interaction-create.eventv2";
import { IInteractionHandler } from "@interface/IInteractionHandler";
import { CommandHandler } from "./components.DiscordInteractions/Command.handler";

@Injectable()
export class InteractionManager {
    private readonly _logger = new Logger(InteractionManager.name);
    private readonly _handlers: IInteractionHandler[];

    constructor(commandHandler: CommandHandler) {
        this._handlers = [commandHandler];
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
                    this._logger.error(
                        `Handler "${handler.constructor.name}" failed to process interaction:`,
                        error
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

