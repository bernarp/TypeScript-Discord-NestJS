/**
 * @file InteractionLoggerCreateMessageUser.ts
 * @description Сервис, который слушает событие создания сообщения и логирует его.
 * ВЕРСИЯ 2.0: Наследует AbstractMessageLogger.
 */
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Message, EmbedBuilder } from "discord.js";
import { AppEvents } from "@/event.EventBus/app.events";
import { MessageCreateEvent } from "@/event.EventBus/message-create.event";
import { IInteractionLoggerChannel } from "../abstractions/IInteractionLoggerChannel";

@Injectable()
export class InteractionLoggerCreateMessageUser extends IInteractionLoggerChannel {
    /**
     * @method onMessageCreated
     * @description Координирует процесс логирования созданного сообщения.
     * @param {MessageCreateEvent} payload - Данные события.
     */
    @OnEvent(AppEvents.MESSAGE_CREATED)
    public async onMessageCreated(payload: MessageCreateEvent): Promise<void> {
        const { message } = payload;

        if (!this._isLoggable(message)) {
            return;
        }

        const logChannelId = await this._guildConfig.get(
            message.guildId!,
            "logChannelMessageSendId"
        );
        if (!logChannelId) {
            return;
        }

        const logEmbed = this._createLogEmbed(message);
        await this._sendLog(logChannelId, message.guildId!, logEmbed);
    }

    /**
     * @private
     * @method _createLogEmbed
     * @description Создает встраиваемое сообщение (embed) для лога.
     * @param {Message} message - Созданное сообщение.
     * @returns {EmbedBuilder} Готовый embed.
     */
    private _createLogEmbed(message: Message): EmbedBuilder {
        const author = message.author;
        const content =
            message.content?.substring(0, 1000) ||
            "Содержимое недоступно (embed или пустое сообщение).";

        return this._embedFactory.createInfoEmbed({
            title: "Лог: Отправка сообщения",
            description: `Пользователь **${author.tag}** отправил сообщение.`,
            fields: [
                {
                    name: "👤 Автор",
                    value: `**Tag:** ${author.tag}\n**ID:** \`${author.id}\``,
                    inline: true,
                },
                {
                    name: "📍 Канал",
                    value: message.channel.toString(),
                    inline: true,
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
