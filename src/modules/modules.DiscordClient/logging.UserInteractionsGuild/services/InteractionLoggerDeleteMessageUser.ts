/**
 * @file InteractionLoggerDeleteMessageUser.ts
 * @description Сервис, который слушает событие удаления сообщения и логирует его.
 * ВЕРСИЯ 5.0: Наследует AbstractMessageLogger.
 */
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import {
    AuditLogEvent,
    User,
    Message,
    PartialMessage,
    EmbedBuilder,
} from "discord.js";
import { AppEvents } from "@/event.EventBus/app.events";
import { MessageDeleteEvent } from "@/event.EventBus/message-delete.event";
import { IInteractionLoggerChannel } from "../abstractions/IInteractionLoggerChannel";

@Injectable()
export class InteractionLoggerDeleteMessageUser extends IInteractionLoggerChannel {
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
            deletedMessage.guildId!,
            "logChannelMessageDeleteId"
        );
        if (!logChannelId) {
            return;
        }

        const { author, executor } = await this._fetchAuthorAndExecutor(
            deletedMessage
        );
        if (!author || !executor) {
            return;
        }

        const logEmbed = this._createLogEmbed(deletedMessage, author, executor);
        await this._sendLog(logChannelId, deletedMessage.guildId!, logEmbed);
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
}
