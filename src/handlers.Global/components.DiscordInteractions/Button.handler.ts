/**
 * @file ButtonManager.ts
 * @description Центральный диспетчер для всех взаимодействий с кнопками (ButtonInteraction).
 * @version 1.1.0: Добавлен недостающий метод supports().
 * @author System
 */

import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { DiscoveryService, Reflector } from "@nestjs/core";
import { Collection, Interaction, ButtonInteraction } from "discord.js";
import { IInteractionHandler } from "@interface/IInteractionHandler";
import { IButtonHandler } from "@interface/IButtonHandler";
import { ILogger } from "@interface/logger/ILogger";
import { BUTTON_METADATA_KEY } from "@decorators/button.decorator";

@Injectable()
export class ButtonManager implements IInteractionHandler, OnModuleInit {
    private readonly _handlers = new Collection<
        string | RegExp,
        IButtonHandler
    >();

    constructor(
        private readonly _discoveryService: DiscoveryService,
        private readonly _reflector: Reflector,
        @Inject("ILogger") private readonly _logger: ILogger
    ) {}

    public onModuleInit() {
        this._loadHandlers();
    }

    /**
     * @inheritdoc
     */
    public supports(interaction: Interaction): boolean {
        return interaction.isButton();
    }

    public async handle(interaction: ButtonInteraction): Promise<void> {
        const handler = this._findHandler(interaction.customId);

        if (!handler) {
            this._logger.warn(
                `No button handler found for customId: "${interaction.customId}"`,
                {
                    guildId: interaction.guildId,
                    channelId: interaction.channelId,
                    userId: interaction.user.id,
                }
            );
            try {
                await interaction.reply({
                    content: "Эта кнопка больше не активна.",
                    ephemeral: true,
                });
            } catch (e) {}
            return;
        }

        try {
            await handler.execute(interaction);
        } catch (error) {
            this._logger.err(
                `Button handler for customId "${interaction.customId}" threw an error:`,
                error.stack,
                { customId: interaction.customId }
            );
            throw error;
        }
    }

    private _loadHandlers(): void {
        this._logger.inf(
            "Searching for button handlers using DiscoveryService..."
        );
        const providers = this._discoveryService.getProviders();

        providers
            .filter(
                (wrapper) =>
                    wrapper.instance &&
                    this._reflector.get(
                        BUTTON_METADATA_KEY,
                        wrapper.instance.constructor
                    )
            )
            .forEach((wrapper) => {
                const handler = wrapper.instance as IButtonHandler;
                if (handler.customId) {
                    this._handlers.set(handler.customId, handler);
                    this._logger.inf(
                        `Button handler for customId "${handler.customId.toString()}" discovered and loaded.`
                    );
                }
            });

        if (this._handlers.size === 0) {
            this._logger.warn("No button handlers found to register.");
        }
    }

    private _findHandler(customId: string): IButtonHandler | undefined {
        let handler = this._handlers.get(customId);
        if (handler) {
            return handler;
        }

        for (const h of this._handlers.values()) {
            if (h.customId instanceof RegExp && h.customId.test(customId)) {
                return h;
            }
        }

        return undefined;
    }
}
