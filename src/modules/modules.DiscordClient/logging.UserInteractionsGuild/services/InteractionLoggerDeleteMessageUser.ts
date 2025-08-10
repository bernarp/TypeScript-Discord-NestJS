/**
 * @file InteractionLoggerDeleteMessageUser.ts
 * @description Сервис, который слушает событие удаления сообщения и логирует его.
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
    @OnEvent(AppEvents.MESSAGE_DELETED)
    public async onMessageDeleted(payload: MessageDeleteEvent): Promise<void> {
        const { deletedMessage } = payload;

        if (!this._isLoggable(deletedMessage)) {
            return;
        }

        // ИЗМЕНЕНИЕ: Явно указываем ожидаемый тип <string> для `get`.
        const logChannelId = await this._guildConfig.get<string>(
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

    private _createLogEmbed(
        message: Message | PartialMessage,
        author: User,
        executor: User
    ): EmbedBuilder {
        const content =
            message.content?.substring(0, 1000) ||
            "Содержимое недоступно (embed или пустое сообщение).";

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
}
