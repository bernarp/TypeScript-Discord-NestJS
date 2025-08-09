/**
 * @file InteractionLoggerDeleteMessageUser.ts
 * @description Сервис, который слушает событие удаления сообщения и логирует его.
 * @version 4.1: Исправлена ошибка типизации при получении исполнителя из аудит-лога.
 */
import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { IClient } from "@interface/IClient";
import { IGuildConfig } from "@interface/IGuildConfig";
import {
    TextChannel,
    AuditLogEvent,
    User,
    Message,
    PartialMessage,
    EmbedBuilder,
} from "discord.js";
import { Service } from "@core/abstractions/Service";
import { AppEvents } from "@/event.EventBus/app.events";
import { MessageDeleteEvent } from "@/event.EventBus/message-delete.event";

@Injectable()
export class InteractionLoggerDeleteMessageUser extends Service {
    private readonly _logger = new Logger(
        InteractionLoggerDeleteMessageUser.name
    );

    constructor(
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory,
        @Inject("IClient") private readonly _client: IClient,
        @Inject("IGuildConfig") private readonly _guildConfig: IGuildConfig
    ) {
        super();
    }

    /**
     * @method onMessageDeleted
     * @description Координирует процесс логирования удаленного сообщения.
     * @param {MessageDeleteEvent} payload - Данные события.
     */
    @OnEvent(AppEvents.MESSAGE_DELETED)
    public async onMessageDeleted(payload: MessageDeleteEvent): Promise<void> {
        const { deletedMessage } = payload;

        if (!this._isLoggable(deletedMessage)) {
            return;
        }

        const logChannelId = await this._guildConfig.get(
            deletedMessage.guildId,
            "logChannelMessageDeleteId"
        );
        if (!logChannelId) {
            return;
        }

        const { author, executor } = await this._fetchAuthorAndExecutor(
            deletedMessage
        );
        // Если автора или исполнителя определить не удалось, логировать нечего.
        if (!author || !executor) {
            return;
        }

        const logEmbed = this._createLogEmbed(deletedMessage, author, executor);
        await this._sendLog(logChannelId, deletedMessage.guildId, logEmbed);
    }

    /**
     * @private
     * @method _isLoggable
     * @description Проверяет, подлежит ли сообщение логированию (не бот, есть автор и сервер).
     * @param {Message | PartialMessage} message - Удаленное сообщение.
     * @returns {boolean} True, если сообщение нужно логировать.
     */
    private _isLoggable(message: Message | PartialMessage): boolean {
        return !!(
            message.guild &&
            message.guildId &&
            message.author &&
            !message.author.bot
        );
    }

    /**
     * @private
     * @method _fetchAuthorAndExecutor
     * @description Получает полные объекты User для автора и исполнителя удаления.
     * @param {Message | PartialMessage} message - Удаленное сообщение.
     * @returns {Promise<{author: User | null; executor: User | null}>} Объект с автором и исполнителем.
     */
    private async _fetchAuthorAndExecutor(
        message: Message | PartialMessage
    ): Promise<{ author: User | null; executor: User | null }> {
        let author: User | null = null;
        if (message.author) {
            author = message.author.partial
                ? await message.author.fetch()
                : message.author;
        }
        if (!author) return { author: null, executor: null };
        let executor: User | null = author;
        if (message.guild) {
            try {
                const auditLogs = await message.guild.fetchAuditLogs({
                    type: AuditLogEvent.MessageDelete,
                    limit: 5,
                });

                const deleteLog = auditLogs.entries.find(
                    (log) =>
                        log.target.id === author?.id &&
                        Date.now() - log.createdTimestamp < 5000 
                );
                if (deleteLog?.executor) {
                    executor = await this._client.users.fetch(
                        deleteLog.executor.id
                    );
                }
            } catch (error) {
                this._logger.warn(
                    `Could not fetch audit logs for guild ${message.guildId}:`,
                    error
                );
            }
        }

        return { author, executor };
    }

    /**
     * @private
     * @method _createLogEmbed
     * @description Создает встраиваемое сообщение (embed) для лога.
     * @param {Message | PartialMessage} message - Удаленное сообщение.
     * @param {User} author - Автор сообщения.
     * @param {User} executor - Пользователь, удаливший сообщение.
     * @returns {EmbedBuilder} Готовый embed.
     */
    private _createLogEmbed(
        message: Message | PartialMessage,
        author: User,
        executor: User
    ): EmbedBuilder {
        const content =
            message.content?.substring(0, 1000) ||
            "Содержимое недоступно (embed или пустое сообщение).";

        return this._embedFactory.createErrorEmbed({
            title: "Лог: Удаление сообщения",
            description: `Сообщение от пользователя **${author.tag}** было удалено.`,
            fields: [
                {
                    name: "👤 Автор сообщения",
                    value: `**Tag:** ${author.tag}\n**ID:** \`${author.id}\``,
                    inline: true,
                },
                {
                    name: "🔥 Кем удалено",
                    value: `**Tag:** ${executor.tag}\n**ID:** \`${executor.id}\``,
                    inline: true,
                },
                {
                    name: "📍 Канал",
                    value: message.channel.toString(),
                    inline: false,
                },
                {
                    name: "📜 Содержимое",
                    value: `\`\`\`${content}\`\`\``,
                    inline: false,
                },
            ],
            context: { user: author, guild: message.guild! },
        });
    }

    /**
     * @private
     * @method _sendLog
     * @description Отправляет embed в указанный канал логов.
     * @param {string} channelId - ID канала для логов.
     * @param {string} guildId - ID сервера.
     * @param {EmbedBuilder} embed - Сообщение для отправки.
     */
    private async _sendLog(
        channelId: string,
        guildId: string,
        embed: EmbedBuilder
    ): Promise<void> {
        try {
            const logChannel = await this._client.channels.fetch(channelId);
            if (logChannel instanceof TextChannel) {
                await logChannel.send({ embeds: [embed] });
            } else {
                this._logger.warn(
                    `Channel ${channelId} is not a text channel for guild ${guildId}.`
                );
            }
        } catch (error) {
            this._logger.error(
                `Failed to send log message to channel ${channelId} for guild ${guildId}:`,
                error
            );
        }
    }
}
