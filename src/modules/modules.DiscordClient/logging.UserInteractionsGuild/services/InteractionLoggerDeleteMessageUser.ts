/**
 * @file InteractionLoggerDeleteMessageUser.ts
 * @description Сервис логирования удаления сообщений пользователями.
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
import { BaseMessageLogger } from "../abstractions/classesAbstract/BaseMessageLogger.abstract";
import { LogChannelType } from "../abstractions/LogChannelType.enum";

@Injectable()
export class InteractionLoggerDeleteMessageUser extends BaseMessageLogger {
    @OnEvent(AppEvents.MESSAGE_DELETED)
    public async onMessageDeleted(payload: MessageDeleteEvent): Promise<void> {
        const { deletedMessage } = payload;

        if (!this.isLoggable(deletedMessage)) {
            return;
        }

        const logChannelId = await this.getLogChannelId(
            deletedMessage.guildId!,
            LogChannelType.MESSAGE_DELETE
        );

        if (!logChannelId) {
            return;
        }

        const { author, executor } = await this.fetchAuthorAndExecutor(
            deletedMessage
        );

        if (!author || !executor) {
            return;
        }

        const logEmbed = await this.createLogEmbed(
            deletedMessage,
            author,
            executor
        );
        await this.sendLog(logChannelId, deletedMessage.guildId!, logEmbed);
    }

    public createLogEmbed(
        message: Message | PartialMessage,
        author?: User,
        executor?: User
    ): EmbedBuilder {
        if (!author || !executor) {
            throw new Error(
                "Author and executor are required for delete message log"
            );
        }

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
            context: { user: author, guild: message.guild! },
        });
    }

    /**
     * @private
     * @method fetchAuthorAndExecutor
     * @description Получает автора сообщения и исполнителя удаления.
     */
    private async fetchAuthorAndExecutor(
        message: Message | PartialMessage
    ): Promise<{ author: User | null; executor: User | null }> {
        let author: User | null = null;

        if (message.author) {
            author = message.author.partial
                ? await message.author.fetch()
                : message.author;
        }

        if (!author) {
            return { author: null, executor: null };
        }

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
}
