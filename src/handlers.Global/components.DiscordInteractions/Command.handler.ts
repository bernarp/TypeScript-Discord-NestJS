/**
 * @file Command.handler.ts
 * @description Специализированный обработчик для слеш-команд и их автодополнений.
 * @version 2.1: Рефакторинг для использования кастомного ILogger.
 */
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { DiscoveryService, Reflector } from "@nestjs/core";
import {
    Collection,
    Interaction,
    ChatInputCommandInteraction,
} from "discord.js";
import { IClient } from "@interface/IClient";
import { ICommand } from "@interface/ICommand";
import { IConfigurationService } from "@interface/IConfigurationService";
import { COMMAND_METADATA_KEY } from "@decorators/command.decorator";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AppEvents } from "@/event.EventBus/app.events";
import { InteractionCreateEvent } from "@event.EventBus/interaction-create.eventv2";
import { IInteractionHandler } from "@interface/IInteractionHandler";
import { ILogger } from "@logger/";

@Injectable()
export class CommandHandler implements IInteractionHandler, OnModuleInit {
    private readonly _commands = new Collection<string, ICommand>();

    constructor(
        @Inject("IClient") private readonly _client: IClient,
        @Inject("IConfigurationService")
        private readonly _configService: IConfigurationService,
        private readonly _discoveryService: DiscoveryService,
        private readonly _reflector: Reflector,
        private readonly _eventEmitter: EventEmitter2,
        @Inject("ILogger") private readonly _logger: ILogger
    ) {}

    public supports(interaction: Interaction): boolean {
        return interaction.isChatInputCommand() || interaction.isAutocomplete();
    }

    public async handle(interaction: Interaction): Promise<void> {
        if (
            !interaction.isChatInputCommand() &&
            !interaction.isAutocomplete()
        ) {
            return;
        }

        const command = this._commands.get(interaction.commandName);
        if (!command) {
            this._logger.warn(
                `Received interaction for an unknown command: "${interaction.commandName}"`
            );
            return;
        }

        try {
            await command.execute(interaction);

            if (interaction.isChatInputCommand()) {
                this._eventEmitter.emit(
                    AppEvents.INTERACTION_CREATED_COMMAND,
                    new InteractionCreateEvent<ChatInputCommandInteraction>(
                        interaction
                    )
                );
            }
        } catch (error) {
            this._logger.err(
                `Error processing interaction for command "${command.data.name}":`,
                error.stack
            );

            if (interaction.isChatInputCommand()) {
                await this._replyWithError(interaction);
            }
        }
    }

    public async onModuleInit(): Promise<void> {
        this._loadCommands();

        if (this._client.isReady()) {
            await this._registerCommands();
        } else {
            this._client.once("ready", () => this._registerCommands());
        }
    }

    private _loadCommands(): void {
        this._logger.inf("Searching for commands using DiscoveryService...");
        const providers = this._discoveryService.getProviders();

        providers
            .filter(
                (wrapper) =>
                    wrapper.instance &&
                    this._reflector.get(
                        COMMAND_METADATA_KEY,
                        wrapper.instance.constructor
                    )
            )
            .forEach((wrapper) => {
                const command = wrapper.instance as ICommand;
                if (command.data?.name) {
                    this._commands.set(command.data.name, command);
                    this._logger.inf(
                        `Command "${command.data.name}" discovered and loaded.`
                    );
                }
            });

        if (this._commands.size === 0) {
            this._logger.warn("No commands found to register.");
        }
    }

    private async _registerCommands(): Promise<void> {
        const guildId = this._configService.getEnv<string>("GUILD_ID");
        if (!guildId) {
            this._logger.err(
                "GUILD_ID is not specified in .env config. Skipping command registration."
            );
            return;
        }

        if (this._commands.size === 0) return;

        const commandsData = this._commands.map((cmd) => cmd.data.toJSON());

        try {
            this._logger.inf(
                `Registering ${commandsData.length} commands on guild: ${guildId}`
            );
            await this._client.application!.commands.set(commandsData, guildId);
            this._logger.inf("All commands were successfully registered.");
        } catch (error) {
            this._logger.err(
                "An error occurred while registering commands:",
                error.stack
            );
        }
    }

    private async _replyWithError(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        const reply = {
            content: "An error occurred while executing the command.",
            ephemeral: true,
        };
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        } catch (replyError) {
            this._logger.err(
                `Failed to send error reply for command "${interaction.commandName}":`,
                replyError.stack
            );
        }
    }
}
