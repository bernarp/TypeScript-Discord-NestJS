/**
 * @file InteractionLoggerUpdateMessageUser.ts
 * @description Сервис логирования редактирования сообщений пользователями.
 */

import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Message, PartialMessage, EmbedBuilder, User } from "discord.js";
import { AppEvents } from "@/event.EventBus/app.events";
import { MessageUpdateEvent } from "@/event.EventBus/message-update.event";
import { BaseMessageLogger } from "../abstractions/classesAbstract/BaseMessageLogger.abstract";
import { LogChannelType } from "../abstractions/LogChannelType.enum";

@Injectable()
export class InteractionLoggerUpdateMessageUser extends BaseMessageLogger {
    @OnEvent(AppEvents.MESSAGE_UPDATED)
    public async onMessageUpdated(payload: MessageUpdateEvent): Promise<void> {
        const { oldMessage, newMessage } = payload;

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
        newMessage?: Message | PartialMessage
    ): Promise<EmbedBuilder> {
        if (!newMessage) {
            throw new Error("New message is required for update message log");
        }

        const author: User = newMessage.author!.partial
            ? await newMessage.author!.fetch()
            : newMessage.author!;

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
