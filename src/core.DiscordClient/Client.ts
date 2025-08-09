/**
 * @file Client.ts
 * @description Реализация основного клиента Discord. Теперь он слушает события сообщений и транслирует их во внутреннюю шину событий.
 */
import {
    Client as BaseClient,
    Events,
    GatewayIntentBits,
    Message,
    PartialMessage,
} from "discord.js";
import { Injectable, Logger, Inject } from "@nestjs/common";
import { IClient } from "@interface/IClient";
import { IConfig } from "@interface/IConfig";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AppEvents } from "@/event.EventBus/app.events";
import { MessageCreateEvent } from "@event.EventBus/message-create.event";
import { MessageUpdateEvent } from "@event.EventBus/message-update.event";
import { MessageDeleteEvent } from "@event.EventBus/message-delete.event";

@Injectable()
export class Client extends BaseClient implements IClient {
    private readonly _logger = new Logger(Client.name);

    constructor(
        @Inject("IConfig") private readonly _config: IConfig,
        private readonly _eventEmitter: EventEmitter2
    ) {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
        });
    }

    /**
     * @inheritdoc
     */
    public async start(): Promise<void> {
        this._logger.log("Attempting to log in to Discord...");

        this._registerDiscordEventHandlers();

        this.once(Events.ClientReady, () => {
            this._logger.log(
                `Bot has successfully logged in as ${this.user?.tag}`
            );
        });

        const token = this._config.get<string>("TOKEN");
        await this.login(token);
    }

    /**
     * @inheritdoc
     */
    public async shutdown(): Promise<void> {
        this._logger.log("Shutting down bot...");
        await this.destroy();
    }

    /**
     * @private
     * @method _registerDiscordEventHandlers
     * @description Регистрирует обработчики для "сырых" событий от discord.js,
     * которые транслируют их во внутреннюю шину событий приложения.
     */
    private _registerDiscordEventHandlers(): void {
        this.on(Events.MessageCreate, (message) =>
            this._onMessageCreate(message)
        );
        this.on(Events.MessageUpdate, (oldMessage, newMessage) =>
            this._onMessageUpdate(oldMessage, newMessage)
        );
        this.on(Events.MessageDelete, (message) =>
            this._onMessageDelete(message)
        );

        this._logger.log("Discord event handlers registered.");
    }

    /**
     * @private
     * @method _onMessageCreate
     * @description Вызывается при создании сообщения. Генерирует внутреннее событие MESSAGE_CREATED.
     * @param {Message} message - Созданное сообщение.
     */
    private _onMessageCreate(message: Message): void {
        if (!message.inGuild()) return;

        const event = new MessageCreateEvent(message);
        this._eventEmitter.emit(AppEvents.MESSAGE_CREATED, event);
    }

    /**
     * @private
     * @method _onMessageUpdate
     * @description Вызывается при редактировании сообщения. Генерирует внутреннее событие MESSAGE_UPDATED.
     * @param {Message | PartialMessage} oldMessage - Старое сообщение (может быть частичным).
     * @param {Message | PartialMessage} newMessage - Новое сообщение (может быть частичным).
     */
    private _onMessageUpdate(
        oldMessage: Message | PartialMessage,
        newMessage: Message | PartialMessage
    ): void {
        if (!newMessage.inGuild()) return;

        const event = new MessageUpdateEvent(oldMessage, newMessage);
        this._eventEmitter.emit(AppEvents.MESSAGE_UPDATED, event);
    }

    /**
     * @private
     * @method _onMessageDelete
     * @description Вызывается при удалении сообщения. Генерирует внутреннее событие MESSAGE_DELETED.
     * @param {Message | PartialMessage} message - Удаленное сообщение (может быть частичным).
     */
    private _onMessageDelete(message: Message | PartialMessage): void {
        if (!message.inGuild()) return;

        const event = new MessageDeleteEvent(message);
        this._eventEmitter.emit(AppEvents.MESSAGE_DELETED, event);
    }
}
