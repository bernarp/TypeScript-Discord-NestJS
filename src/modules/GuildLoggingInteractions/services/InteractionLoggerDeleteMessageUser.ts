/**
 * @file InteractionLoggerDeleteMessageUser.ts
 * @description Сервис логирования удаления сообщений пользователями.
 * @version 2.3: Окончательное исправление обработки PartialUser с помощью хелпер-метода.
 */

import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import {
    AuditLogEvent,
    User,
    Message,
    PartialMessage,
    EmbedBuilder,
    PartialUser,
} from "discord.js";
import { AppEvents } from "@events/app.events";
import { MessageDeleteEvent } from "@events/message-delete.event";
import { BaseMessageLogger } from "../abstractions/classesAbstract/BaseMessageLogger.abstract";
import { LogChannelType } from "../abstractions/LogChannelType.enum";

@Injectable()
export class InteractionLoggerDeleteMessageUser extends BaseMessageLogger {
    @OnEvent(AppEvents.MESSAGE_DELETED)
    public async onMessageDeleted(payload: MessageDeleteEvent): Promise<void> {
        const { deletedMessage } = payload;

        if (!deletedMessage.guildId || !this.isLoggable(deletedMessage)) {
            return;
        }

        const logChannelId = await this.getLogChannelId(
            deletedMessage.guildId,
            LogChannelType.MESSAGE_DELETE
        );

        if (!logChannelId) {
            return;
        }

        const { author, executor } = await this._fetchAuthorAndExecutor(
            deletedMessage
        );

        if (!author) {
            this._logger.debug(
                "Skipping delete log because the author could not be determined."
            );
            return;
        }

        const finalExecutor = executor ?? author;

        const logEmbed = this.createLogEmbed(
            deletedMessage,
            author,
            finalExecutor
        );
        await this.sendLog(logChannelId, deletedMessage.guildId, logEmbed);
    }

    public createLogEmbed(
        message: Message | PartialMessage,
        author: User,
        executor: User
    ): EmbedBuilder {
        const content = this.truncateContent(message.content);

        return this._embedFactory.create({
            title: "Лог: Удаление сообщения",
            color: "#e67474",
            description: `Сообщение от пользователя **${author.tag}** было удалено.`,
            fields: [
                {
                    name: "Автор сообщения",
                    value: `**Tag:** ${author.tag}\n**ID:** \`${author.id}\``,
                    inline: true,
                },
                {
                    name: "Кем удалено",
                    value: `**Tag:** ${executor.tag}\n**ID:** \`${executor.id}\``,
                    inline: true,
                },
                {
                    name: "Канал",
                    value: message.channel.toString(),
                    inline: false,
                },
                {
                    name: "Содержимое",
                    value: `\`\`\`${content}\`\`\``,
                    inline: false,
                },
            ],
            context: { user: executor, guild: message.guild! },
        });
    }

    /**
     * @private
     * @method _fetchAuthorAndExecutor
     * @description Получает автора сообщения и исполнителя удаления из логов аудита.
     * @returns {Promise<{ author: User | null; executor: User | null }>}
     */
    private async _fetchAuthorAndExecutor(
        message: Message | PartialMessage
    ): Promise<{ author: User | null; executor: User | null }> {
        const author = await this._resolveUser(message.author);

        if (!author || !message.guild) {
            return { author: null, executor: null };
        }

        try {
            const auditLogs = await message.guild.fetchAuditLogs({
                type: AuditLogEvent.MessageDelete,
                limit: 5,
            });

            const deleteLog = auditLogs.entries.find(
                (log) =>
                    log.target.id === author.id &&
                    Date.now() - log.createdTimestamp < 5000
            );

            if (deleteLog?.executor) {
                const executor = await this._resolveUser(deleteLog.executor);
                return { author, executor };
            }
        } catch (error) {
            this._logger.warn(
                `Could not fetch audit logs for guild ${message.guildId}:`,
                error
            );
        }

        return { author, executor: author };
    }

    /**
     * @private
     * @method _resolveUser
     * @description Гарантированно преобразует частичный объект пользователя (PartialUser) в полный (User).
     * @param {User | PartialUser | null} user - Объект пользователя для разрешения.
     * @returns {Promise<User | null>} Полный объект User или null в случае ошибки.
     */
    private async _resolveUser(
        user: User | PartialUser | null
    ): Promise<User | null> {
        if (!user) {
            return null;
        }
        try {
            return await user.fetch();
        } catch (error) {
            this._logger.warn(`Could not fetch user ${user.id}:`, error);
            return null;
        }
    }
}
