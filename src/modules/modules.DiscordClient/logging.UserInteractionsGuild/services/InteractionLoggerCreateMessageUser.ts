/**
 * @file InteractionLoggerCreateMessageUser.ts
 * @description Сервис логирования создания сообщений пользователями.
 */

import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Message, EmbedBuilder } from "discord.js";
import { AppEvents } from "@/event.EventBus/app.events";
import { MessageCreateEvent } from "@/event.EventBus/message-create.event";
import { BaseMessageLogger } from "../abstractions/classesAbstract/BaseMessageLogger.abstract";
import { LogChannelType } from "../abstractions/LogChannelType.enum";
@Injectable()
export class InteractionLoggerCreateMessageUser extends BaseMessageLogger {
    @OnEvent(AppEvents.MESSAGE_CREATED)
    public async onMessageCreated(payload: MessageCreateEvent): Promise<void> {
        const { message } = payload;

        if (!this.isLoggable(message)) {
            return;
        }

        const logChannelId = await this.getLogChannelId(
            message.guildId!,
            LogChannelType.MESSAGE_CREATE
        );

        if (!logChannelId) {
            return;
        }

        const logEmbed = this.createLogEmbed(message);
        await this.sendLog(logChannelId, message.guildId!, logEmbed);
    }

    public createLogEmbed(message: Message): EmbedBuilder {
        const author = message.author;
        const content = this.truncateContent(message.content);

        return this._embedFactory.createInfoEmbed({
            title: "Лог: Отправка сообщения",
            description: `Пользователь **${author.tag}** отправил сообщение.`,
            fields: [
                {
                    name: "Автор",
                    value: `**Tag:** ${author.tag}\n**ID:** \`${author.id}\``,
                    inline: true,
                },
                {
                    name: "Канал",
                    value: message.channel.toString(),
                    inline: true,
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
