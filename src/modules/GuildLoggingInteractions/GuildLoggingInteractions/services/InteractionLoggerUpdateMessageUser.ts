/**
 * @file InteractionLoggerUpdateMessageUser.ts
 * @description Сервис логирования редактирования сообщений пользователями.
 */

import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Message, PartialMessage, EmbedBuilder, User } from "discord.js";
import { AppEvents } from "@events/app.events";
import { MessageUpdateEvent } from "@events/message-update.event";
import { BaseMessageLogger } from "../abstractions/classesAbstract/BaseMessageLogger.abstract";
import { LogChannelType } from "../abstractions/LogChannelType.enum";

@Injectable()
export class InteractionLoggerUpdateMessageUser extends BaseMessageLogger {
    @OnEvent(AppEvents.MESSAGE_UPDATED)
    public async onMessageUpdated(payload: MessageUpdateEvent): Promise<void> {
        const { oldMessage, newMessage } = payload;

        // Не логируем, если контент не изменился или сообщение не соответствует критериям
        if (
            oldMessage.content === newMessage.content ||
            !this.isLoggable(newMessage)
        ) {
            return;
        }

        const logChannelId = await this.getLogChannelId(
            newMessage.guildId!,
            LogChannelType.MESSAGE_UPDATE
        );

        if (!logChannelId) {
            return;
        }

        const logEmbed = await this.createLogEmbed(oldMessage, newMessage);
        await this.sendLog(logChannelId, newMessage.guildId!, logEmbed);
    }

    public async createLogEmbed(
        oldMessage: Message | PartialMessage,
        newMessage: Message | PartialMessage
    ): Promise<EmbedBuilder> {
        let author: User | null = newMessage.author;
        if (author?.partial) {
            try {
                author = await author.fetch();
            } catch {
                // Если не удалось получить автора, прерываем создание лога
                throw new Error(
                    "Could not fetch partial author for message update log."
                );
            }
        }
        if (!author) {
            throw new Error("Author is null for message update log.");
        }

        const oldContent = this.truncateContent(oldMessage.content);
        const newContent = this.truncateContent(newMessage.content);

        return this._embedFactory.createInfoEmbed({
            title: "Лог: Редактирование сообщения",
            description: `Пользователь **${author.tag}** отредактировал сообщение.`,
            fields: [
                {
                    name: "Автор",
                    value: `**Tag:** ${author.tag}\n**ID:** \`${author.id}\``,
                    inline: true,
                },
                {
                    name: "Канал",
                    value: newMessage.channel.toString(),
                    inline: true,
                },
                {
                    name: "Старое содержимое",
                    value: `\`\`\`${oldContent}\`\`\``,
                    inline: false,
                },
                {
                    name: "Новое содержимое",
                    value: `\`\`\`${newContent}\`\`\``,
                    inline: false,
                },
            ],
            context: { user: author, guild: newMessage.guild! },
        });
    }
}
