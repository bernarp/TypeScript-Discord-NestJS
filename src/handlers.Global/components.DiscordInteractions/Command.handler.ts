/**
 * @file Command.handler.ts
 * @description Специализированный обработчик для слеш-команд и их автодополнения.
 */
import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { DiscoveryService, Reflector } from "@nestjs/core";
import {
    Collection,
    Interaction,
    ChatInputCommandInteraction,
} from "discord.js";
import { IClient } from "@interface/IClient";
import { ICommand } from "@interface/ICommand";
import { IConfig } from "@interface/IConfig";
import { COMMAND_METADATA_KEY } from "@decorators/command.decorator";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AppEvents } from "@/event.EventBus/app.events";
import { InteractionCreateEvent } from "@event.EventBus/interaction-create.eventv2";
import { IInteractionHandler } from "@interface/IInteractionHandler";

@Injectable()
export class CommandHandler implements IInteractionHandler, OnModuleInit {
    private readonly _logger = new Logger(CommandHandler.name);
    private readonly _commands = new Collection<string, ICommand>();

    constructor(
        @Inject("IClient") private readonly _client: IClient,
        @Inject("IConfig") private readonly _config: IConfig,
        private readonly _discoveryService: DiscoveryService,
        private readonly _reflector: Reflector,
        private readonly _eventEmitter: EventEmitter2
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
                this._logger.debug(
                    `Emitting event for command "${interaction.commandName}" execution.`
                );
                this._eventEmitter.emit(
                    AppEvents.INTERACTION_CREATED_COMMAND,
                    new InteractionCreateEvent<ChatInputCommandInteraction>(
                        interaction
                    )
                );
            }
        } catch (error) {
            this._logger.error(
                `Error processing interaction for command "${command.data.name}":`,
                error
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
        this._logger.log("Searching for commands using DiscoveryService...");
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
                    this._logger.log(
                        `Command "${command.data.name}" discovered and loaded.`
                    );
                }
            });

        if (this._commands.size === 0) {
            this._logger.warn("No commands found to register.");
        }
    }

    private async _registerCommands(): Promise<void> {
        const guildId = this._config.get<string>("GUILD_ID");
        if (!guildId) {
            this._logger.error(
                "GUILD_ID is not specified in config. Skipping command registration."
            );
            return;
        }

        if (this._commands.size === 0) return;

        const commandsData = this._commands.map((cmd) => cmd.data.toJSON());

        try {
            this._logger.log(
                `Registering ${commandsData.length} commands on guild: ${guildId}`
            );
            await this._client.application!.commands.set(commandsData, guildId);
            this._logger.log("All commands were successfully registered.");
        } catch (error) {
            this._logger.error(
                "An error occurred while registering commands:",
                error
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
            this._logger.error(
                `Failed to send error reply for command "${interaction.commandName}":`,
                replyError
            );
        }
    }
}
