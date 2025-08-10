/**
 * @file CommandHandler.ts
 * @description Главный сервис, который находит, регистрирует и выполняет команды.
 * ВЕРСИЯ 2.0: Добавлена поддержка AutocompleteInteraction.
 */
import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { DiscoveryService, Reflector } from "@nestjs/core";
import {
    ChatInputCommandInteraction,
    Collection,
    Interaction, // ИЗМЕНЕНИЕ: Импортируем базовый тип Interaction
} from "discord.js";
import { IClient } from "@interface/IClient";
import { ICommand } from "@interface/ICommand";
import { IConfig } from "@interface/IConfig";
import { COMMAND_METADATA_KEY } from "@decorators/command.decorator";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AppEvents } from "@/event.EventBus/app.events";
import { InteractionCreateEvent } from "@event.EventBus/interaction-create.event";

@Injectable()
export class CommandHandlerService implements OnModuleInit {
    private readonly _logger = new Logger(CommandHandlerService.name);
    private readonly _commands = new Collection<string, ICommand>();

    constructor(
        @Inject("IClient") private readonly _client: IClient,
        @Inject("IConfig") private readonly _config: IConfig,
        private readonly _discoveryService: DiscoveryService,
        private readonly _reflector: Reflector,
        private readonly _eventEmitter: EventEmitter2
    ) {}

    public async onModuleInit(): Promise<void> {
        this._loadCommands();

        if (this._client.isReady()) {
            await this._setupAndRegisterCommands();
        } else {
            this._client.once("ready", async () => {
                await this._setupAndRegisterCommands();
            });
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

    private async _setupAndRegisterCommands(): Promise<void> {
        await this._registerCommands();

        // ИЗМЕНЕНИЕ: Слушаем событие и передаем его в новый, более умный обработчик.
        this._client.on("interactionCreate", (interaction) => {
            this._onInteractionCreate(interaction);
        });

        this._logger.log("Command handler successfully configured.");
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

    // ИЗМЕНЕНИЕ: Метод теперь принимает базовый тип Interaction и сам решает, что делать.
    private async _onInteractionCreate(
        interaction: Interaction
    ): Promise<void> {
        // Проверяем, является ли взаимодействие командой или автодополнением.
        // Остальные типы (кнопки, модальные окна) игнорируем.
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
            // Передаем взаимодействие в команду. Команда сама разберется,
            // автодополнение это или выполнение.
            await command.execute(interaction);

            // Генерируем событие только для реального выполнения команды, а не для автодополнения.
            if (interaction.isChatInputCommand()) {
                this._logger.debug(
                    `Emitting event for command "${interaction.commandName}" execution.`
                );
                this._eventEmitter.emit(
                    AppEvents.INTERACTION_CREATED_COMMAND,
                    new InteractionCreateEvent(interaction)
                );
            }
        } catch (error) {
            this._logger.error(
                `Error processing interaction for command "${command.data.name}":`,
                error
            );

            // Отвечаем на ошибку только если это не автодополнение.
            if (interaction.isChatInputCommand()) {
                const reply = {
                    content: "An error occurred while executing the command.",
                    ephemeral: true,
                };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply);
                } else {
                    await interaction.reply(reply);
                }
            }
        }
    }
}
