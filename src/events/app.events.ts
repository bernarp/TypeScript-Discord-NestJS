/**
 * @file app.events.ts
 * @description Централизованный реестр всех имен событий в приложении.
 * Использование этого объекта вместо строковых литералов обеспечивает:
 * 1. Защиту от опечаток (TypeScript выдаст ошибку, если имя неверно).
 * 2. Автодополнение в IDE (написав "AppEvents.", вы увидите все доступные события).
 * 3. Централизованную документацию всех событий в одном месте.
 */
export const AppEvents = {
    CLIENT_READY: "client.ready",

    // =================================================================
    // --- События, связанные с сообщениями (Message) ---
    // =================================================================
    /**
     * @event message.created
     * @description Срабатывает при создании нового сообщения в канале.
     * @payload {MessageCreateEvent}
     */
    MESSAGE_CREATED: "message.created",

    /**
     * @event message.updated
     * @description Срабатывает при обновлении (редактировании) существующего сообщения.
     * @payload {MessageUpdateEvent}
     */
    MESSAGE_UPDATED: "message.updated",

    /**
     * @event message.deleted
     * @description Срабатывает при удалении сообщения.
     * @payload {MessageDeleteEvent}
     */
    MESSAGE_DELETED: "message.deleted",

    /**
     * @event message.deleted.bulk
     * @description Срабатывает при массовом удалении сообщений.
     * @payload {MessageDeleteBulkEvent} - TODO: Создать класс события
     */
    MESSAGE_DELETED_BULK: "message.deleted.bulk",

    // =================================================================
    // --- События, связанные с реакциями (Reaction) ---
    // =================================================================
    /**
     * @event reaction.added
     * @description Срабатывает, когда пользователь добавляет реакцию к сообщению.
     * @payload {ReactionAddEvent} - TODO: Создать класс события
     */
    REACTION_ADDED: "reaction.added",

    /**
     * @event reaction.removed
     * @description Срабатывает, когда пользователь убирает реакцию с сообщения.
     * @payload {ReactionRemoveEvent} - TODO: Создать класс события
     */
    REACTION_REMOVED: "reaction.removed",

    /**
     * @event reaction.removed.all
     * @description Срабатывает, когда все реакции убираются с сообщения.
     * @payload {ReactionRemoveAllEvent} - TODO: Создать класс события
     */
    REACTION_REMOVED_ALL: "reaction.removed.all",

    /**
     * @event reaction.removed.emoji
     * @description Срабатывает, когда все реакции определенного эмодзи убираются с сообщения.
     * @payload {ReactionRemoveEmojiEvent} - TODO: Создать класс события
     */
    REACTION_REMOVED_EMOJI: "reaction.removed.emoji",

    // =================================================================
    // --- События, связанные с взаимодействиями (Interaction) ---
    // =================================================================

    INTERACTION_CREATED: "interaction.created",
    /**
     * @event interaction.created.command
     * @description Срабатывает, когда пользователь выполняет слеш-команду.
     * @payload {InteractionCreateEvent}
     */
    INTERACTION_CREATED_COMMAND: "interaction.created.command",

    /**
     * @event interaction.created.button
     * @description Срабатывает, когда пользователь нажимает на кнопку.
     * @payload {ButtonInteractionEvent} - TODO: Создать класс события
     */
    INTERACTION_CREATED_BUTTON: "interaction.created.button",

    /**
     * @event interaction.created.modal
     * @description Срабатывает, когда пользователь отправляет модальное окно.
     * @payload {ModalSubmitInteractionEvent} - TODO: Создать класс события
     */
    INTERACTION_CREATED_MODAL: "interaction.created.modal",

    /**
     * @event interaction.created.select_menu
     * @description Срабатывает, когда пользователь выбирает опцию в выпадающем меню.
     * @payload {SelectMenuInteractionEvent} - TODO: Создать класс события
     */
    INTERACTION_CREATED_SELECT_MENU: "interaction.created.select_menu",

    /**
     * @event interaction.created.autocomplete
     * @description Срабатывает, когда пользователь вводит текст в поле с автодополнением.
     * @payload {AutocompleteInteractionEvent} - TODO: Создать класс события
     */
    INTERACTION_CREATED_AUTOCOMPLETE: "interaction.created.autocomplete",

    // =================================================================
    // --- События, связанные с участниками гильдии (Guild Member) ---
    // =================================================================
    /**
     * @event guild.member.added
     * @description Срабатывает, когда новый участник присоединяется к серверу.
     * @payload {GuildMemberAddEvent} - TODO: Создать класс события
     */
    GUILD_MEMBER_ADDED: "guild.member.added",

    /**
     * @event guild.member.removed
     * @description Срабатывает, когда участник покидает сервер (или его кикают/банят).
     * @payload {GuildMemberRemoveEvent} - TODO: Создать класс события
     */
    GUILD_MEMBER_REMOVED: "guild.member.removed",

    /**
     * @event guild.member.updated
     * @description Срабатывает при изменении участника (например, смена ника, получение/потеря роли).
     * @payload {GuildMemberUpdateEvent} - TODO: Создать класс события
     */
    GUILD_MEMBER_UPDATED: "guild.member.updated",

    // =================================================================
    // --- События, связанные с ролями (Role) ---
    // =================================================================
    /**
     * @event role.created
     * @description Срабатывает при создании новой роли на сервере.
     * @payload {RoleCreateEvent} - TODO: Создать класс события
     */
    ROLE_CREATED: "role.created",

    /**
     * @event role.deleted
     * @description Срабатывает при удалении роли.
     * @payload {RoleDeleteEvent} - TODO: Создать класс события
     */
    ROLE_DELETED: "role.deleted",

    /**
     * @event role.updated
     * @description Срабатывает при изменении роли (например, смена цвета, прав).
     * @payload {RoleUpdateEvent} - TODO: Создать класс события
     */
    ROLE_UPDATED: "role.updated",

    // =================================================================
    // --- События, связанные с каналами (Channel) ---
    // =================================================================
    /**
     * @event channel.created
     * @description Срабатывает при создании нового канала.
     * @payload {ChannelCreateEvent} - TODO: Создать класс события
     */
    CHANNEL_CREATED: "channel.created",

    /**
     * @event channel.deleted
     * @description Срабатывает при удалении канала.
     * @payload {ChannelDeleteEvent} - TODO: Создать класс события
     */
    CHANNEL_DELETED: "channel.deleted",

    /**
     * @event channel.updated
     * @description Срабатывает при изменении настроек канала.
     * @payload {ChannelUpdateEvent} - TODO: Создать класс события
     */
    CHANNEL_UPDATED: "channel.updated",

    /**
     * @event channel.pins.updated
     * @description Срабатывает при изменении закрепленных сообщений в канале.
     * @payload {ChannelPinsUpdateEvent} - TODO: Создать класс события
     */
    CHANNEL_PINS_UPDATED: "channel.pins.updated",

    // =================================================================
    // --- События, связанные с тредами (Thread) ---
    // =================================================================
    /**
     * @event thread.created
     * @description Срабатывает при создании нового треда.
     * @payload {ThreadCreateEvent} - TODO: Создать класс события
     */
    THREAD_CREATED: "thread.created",

    /**
     * @event thread.updated
     * @description Срабатывает при обновлении треда.
     * @payload {ThreadUpdateEvent} - TODO: Создать класс события
     */
    THREAD_UPDATED: "thread.updated",

    /**
     * @event thread.deleted
     * @description Срабатывает при удалении треда.
     * @payload {ThreadDeleteEvent} - TODO: Создать класс события
     */
    THREAD_DELETED: "thread.deleted",

    /**
     * @event thread.member.updated
     * @description Срабатывает при изменении участника треда.
     * @payload {ThreadMemberUpdateEvent} - TODO: Создать класс события
     */
    THREAD_MEMBER_UPDATED: "thread.member.updated",

    /**
     * @event thread.members.updated
     * @description Срабатывает при изменении списка участников треда.
     * @payload {ThreadMembersUpdateEvent} - TODO: Создать класс события
     */
    THREAD_MEMBERS_UPDATED: "thread.members.updated",

    // =================================================================
    // --- События, связанные с голосовыми каналами (Voice) ---
    // =================================================================
    /**
     * @event voice.state.updated
     * @description Срабатывает при любом изменении голосового состояния участника
     * (зашел/вышел из канала, включил/выключил микрофон/камеру).
     * @payload {VoiceStateUpdateEvent} - TODO: Создать класс события
     */
    VOICE_STATE_UPDATED: "voice.state.updated",

    /**
     * @event voice.server.updated
     * @description Срабатывает при изменении голосового сервера.
     * @payload {VoiceServerUpdateEvent} - TODO: Создать класс события
     */
    VOICE_SERVER_UPDATED: "voice.server.updated",

    // =================================================================
    // --- События, связанные с гильдиями (Guild) ---
    // =================================================================
    /**
     * @event guild.created
     * @description Срабатывает, когда бот добавляется на новый сервер.
     * @payload {GuildCreateEvent} - TODO: Создать класс события
     */
    GUILD_CREATED: "guild.created",

    /**
     * @event guild.deleted
     * @description Срабатывает, когда бот удаляется с сервера или сервер удаляется.
     * @payload {GuildDeleteEvent} - TODO: Создать класс события
     */
    GUILD_DELETED: "guild.deleted",

    /**
     * @event guild.updated
     * @description Срабатывает при изменении настроек сервера.
     * @payload {GuildUpdateEvent} - TODO: Создать класс события
     */
    GUILD_UPDATED: "guild.updated",

    /**
     * @event guild.unavailable
     * @description Срабатывает, когда сервер становится недоступным из-за сбоя.
     * @payload {GuildUnavailableEvent} - TODO: Создать класс события
     */
    GUILD_UNAVAILABLE: "guild.unavailable",

    /**
     * @event guild.integrations.updated
     * @description Срабатывает при изменении интеграций сервера.
     * @payload {GuildIntegrationsUpdateEvent} - TODO: Создать класс события
     */
    GUILD_INTEGRATIONS_UPDATED: "guild.integrations.updated",

    /**
     * @event guild.ban.added
     * @description Срабатывает, когда пользователь получает бан на сервере.
     * @payload {GuildBanAddEvent} - TODO: Создать класс события
     */
    GUILD_BAN_ADDED: "guild.ban.added",

    /**
     * @event guild.ban.removed
     * @description Срабатывает, когда с пользователя снимается бан.
     * @payload {GuildBanRemoveEvent} - TODO: Создать класс события
     */
    GUILD_BAN_REMOVED: "guild.ban.removed",

    // =================================================================
    // --- События, связанные с эмодзи (Emoji) ---
    // =================================================================
    /**
     * @event emoji.created
     * @description Срабатывает при добавлении нового эмодзи на сервер.
     * @payload {EmojiCreateEvent} - TODO: Создать класс события
     */
    EMOJI_CREATED: "emoji.created",

    /**
     * @event emoji.deleted
     * @description Срабатывает при удалении эмодзи с сервера.
     * @payload {EmojiDeleteEvent} - TODO: Создать класс события
     */
    EMOJI_DELETED: "emoji.deleted",

    /**
     * @event emoji.updated
     * @description Срабатывает при изменении эмодзи (например, смена названия).
     * @payload {EmojiUpdateEvent} - TODO: Создать класс события
     */
    EMOJI_UPDATED: "emoji.updated",

    // =================================================================
    // --- События, связанные со стикерами (Sticker) ---
    // =================================================================
    /**
     * @event sticker.created
     * @description Срабатывает при добавлении нового стикера на сервер.
     * @payload {StickerCreateEvent} - TODO: Создать класс события
     */
    STICKER_CREATED: "sticker.created",

    /**
     * @event sticker.deleted
     * @description Срабатывает при удалении стикера с сервера.
     * @payload {StickerDeleteEvent} - TODO: Создать класс события
     */
    STICKER_DELETED: "sticker.deleted",

    /**
     * @event sticker.updated
     * @description Срабатывает при изменении стикера.
     * @payload {StickerUpdateEvent} - TODO: Создать класс события
     */
    STICKER_UPDATED: "sticker.updated",

    // =================================================================
    // --- События, связанные с приглашениями (Invite) ---
    // =================================================================
    /**
     * @event invite.created
     * @description Срабатывает при создании нового приглашения.
     * @payload {InviteCreateEvent} - TODO: Создать класс события
     */
    INVITE_CREATED: "invite.created",

    /**
     * @event invite.deleted
     * @description Срабатывает при удалении приглашения.
     * @payload {InviteDeleteEvent} - TODO: Создать класс события
     */
    INVITE_DELETED: "invite.deleted",

    // =================================================================
    // --- События, связанные с модерацией (внутренние, не от Discord) ---
    // =================================================================
    /**
     * @event moderation.warn
     * @description Срабатывает, когда модератор выдает предупреждение.
     * @payload {UserWarnedEvent} - TODO: Создать класс события
     */
    MODERATION_WARN: "moderation.warn",

    /**
     * @event moderation.kick
     * @description Срабатывает, когда модератор кикает участника.
     * @payload {UserKickedEvent} - TODO: Создать класс события
     */
    MODERATION_KICK: "moderation.kick",

    /**
     * @event moderation.ban
     * @description Срабатывает, когда модератор банит участника.
     * @payload {UserBannedEvent} - TODO: Создать класс события
     */
    MODERATION_BAN: "moderation.ban",

    /**
     * @event moderation.timeout
     * @description Срабатывает, когда модератор дает таймаут участнику.
     * @payload {UserTimeoutEvent} - TODO: Создать класс события
     */
    MODERATION_TIMEOUT: "moderation.timeout",

    /**
     * @event moderation.mute
     * @description Срабатывает, когда модератор мутит участника в голосовом канале.
     * @payload {UserMutedEvent} - TODO: Создать класс события
     */
    MODERATION_MUTE: "moderation.mute",

    /**
     * @event moderation.unmute
     * @description Срабатывает, когда модератор размучивает участника в голосовом канале.
     * @payload {UserUnmutedEvent} - TODO: Создать класс события
     */
    MODERATION_UNMUTE: "moderation.unmute",

    /**
     * @event moderation.deafen
     * @description Срабатывает, когда модератор делает участника оглушенным в голосовом канале.
     * @payload {UserDeafenedEvent} - TODO: Создать класс события
     */
    MODERATION_DEAFEN: "moderation.deafen",

    /**
     * @event moderation.undeafen
     * @description Срабатывает, когда модератор убирает оглушение с участника в голосовом канале.
     * @payload {UserUndeafenedEvent} - TODO: Создать класс события
     */
    MODERATION_UNDEAFEN: "moderation.undeafen",

    /**
     * @event pinned.message.missing
     * @description Срабатывает, когда PinnedMessageValidator не находит настроенное сообщение.
     * @payload {PinnedMessageMissingEvent}
     */
    PINNED_MESSAGE_MISSING: "pinned.message.missing"
    ,
    /**
     * @event ticket.closed
     * @description Срабатывает после закрытия тикета, но перед удалением канала.
     * @payload {TicketClosedEvent}
     */
    TICKET_CLOSED: "ticket.closed",
};
