/**
 * @file Clientv2.ts
 * @description Реализация основного клиента Discord. Транслирует "сырые" события
 * от discord.js во внутреннюю шину событий приложения.
 * @version 3.3 (Refactored for new ConfigService)
 * @author System
 */
import {
    Client as BaseClient,
    Events,
    GatewayIntentBits,
    GuildBan,
    GuildMember,
    Interaction,
    Message,
    MessageReaction,
    PartialGuildMember,
    PartialMessage,
    PartialMessageReaction,
    PartialUser,
    User,
    Partials,
} from "discord.js";
import { Injectable, Inject } from "@nestjs/common";
import { IClient } from "@interface/IClient";
import { IConfigurationService } from "@interface/config/IConfigurationService";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AppEvents } from "@/event.EventBus/app.events";
import { MessageCreateEvent } from "@event.EventBus/message-create.event";
import { MessageUpdateEvent } from "@event.EventBus/message-update.event";
import { MessageDeleteEvent } from "@event.EventBus/message-delete.event";
import { InteractionCreateEvent } from "@event.EventBus/interaction-create.eventv2";
import { GuildMemberAddEvent } from "@event.EventBus/guild-member-add.event";
import { GuildMemberRemoveEvent } from "@event.EventBus/guild-member-remove.event";
import { GuildBanAddEvent } from "@event.EventBus/guild-ban-add.event";
import { GuildBanRemoveEvent } from "@event.EventBus/guild-ban-remove.event";
import { ReactionAddEvent } from "@event.EventBus/reaction-add.event";
import { ILogger } from "@interface/logger/ILogger";
import { ClientReadyEvent } from "@/event.EventBus/client-ready.event";

@Injectable()
export class Client extends BaseClient implements IClient {
    constructor(
        @Inject("IConfigurationService")
        private readonly _configService: IConfigurationService,
        private readonly _eventEmitter: EventEmitter2,
        @Inject("ILogger") private readonly _logger: ILogger
    ) {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.MessageContent,
            ],
            partials: [
                Partials.Message,
                Partials.Channel,
                Partials.Reaction,
                Partials.User,
                Partials.GuildMember,
            ],
        });
    }

    public async start(): Promise<void> {
        this._logger.inf("Attempting to log in to Discord...");
        this._registerDiscordEventHandlers();

        this.once(Events.ClientReady, () => {
            this._logger.inf(
                `Bot has successfully logged in as ${this.user?.tag}`
            );

            this._eventEmitter.emit(
                AppEvents.CLIENT_READY,
                new ClientReadyEvent(this)
            );
        });

        const token = this._configService.env.getEnv<string>("TOKEN");
        await this.login(token);
    }

    public async shutdown(): Promise<void> {
        this._logger.inf("Shutting down bot...");
        await this.destroy();
    }

    private _registerDiscordEventHandlers(): void {
        this.on(Events.MessageCreate, (m) => this._onMessageCreate(m));
        this.on(Events.MessageUpdate, (o, n) => this._onMessageUpdate(o, n));
        this.on(Events.MessageDelete, (m) => this._onMessageDelete(m));
        this.on(Events.InteractionCreate, (i) => this._onInteractionCreate(i));
        this.on(Events.GuildMemberAdd, (m) => this._onGuildMemberAdd(m));
        this.on(Events.GuildMemberRemove, (m) => this._onGuildMemberRemove(m));
        this.on(Events.GuildBanAdd, (b) => this._onGuildBanAdd(b));
        this.on(Events.GuildBanRemove, (b) => this._onGuildBanRemove(b));
        this.on(Events.MessageReactionAdd, (r, u) =>
            this._onMessageReactionAdd(r, u)
        );

        this._logger.inf("Discord event handlers registered.");
    }

    private _onMessageCreate(message: Message): void {
        if (!message.inGuild()) return;
        this._eventEmitter.emit(
            AppEvents.MESSAGE_CREATED,
            new MessageCreateEvent(message)
        );
    }

    private _onMessageUpdate(
        oldMessage: Message | PartialMessage,
        newMessage: Message | PartialMessage
    ): void {
        if (!newMessage.inGuild()) return;
        this._eventEmitter.emit(
            AppEvents.MESSAGE_UPDATED,
            new MessageUpdateEvent(oldMessage, newMessage)
        );
    }

    private _onMessageDelete(message: Message | PartialMessage): void {
        if (!message.inGuild()) return;
        this._eventEmitter.emit(
            AppEvents.MESSAGE_DELETED,
            new MessageDeleteEvent(message)
        );
    }

    private _onInteractionCreate(interaction: Interaction): void {
        this._eventEmitter.emit(
            AppEvents.INTERACTION_CREATED,
            new InteractionCreateEvent(interaction)
        );
    }

    private _onGuildMemberAdd(member: GuildMember): void {
        this._eventEmitter.emit(
            AppEvents.GUILD_MEMBER_ADDED,
            new GuildMemberAddEvent(member)
        );
    }
    private _onGuildMemberRemove(
        member: GuildMember | PartialGuildMember
    ): void {
        this._eventEmitter.emit(
            AppEvents.GUILD_MEMBER_REMOVED,
            new GuildMemberRemoveEvent(member)
        );
    }

    private _onGuildBanAdd(ban: GuildBan): void {
        this._eventEmitter.emit(
            AppEvents.GUILD_BAN_ADDED,
            new GuildBanAddEvent(ban)
        );
    }

    private _onGuildBanRemove(ban: GuildBan): void {
        this._eventEmitter.emit(
            AppEvents.GUILD_BAN_REMOVED,
            new GuildBanRemoveEvent(ban)
        );
    }

    private _onMessageReactionAdd(
        reaction: MessageReaction | PartialMessageReaction,
        user: User | PartialUser
    ): void {
        this._eventEmitter.emit(
            AppEvents.REACTION_ADDED,
            new ReactionAddEvent(reaction, user)
        );
    }
}
