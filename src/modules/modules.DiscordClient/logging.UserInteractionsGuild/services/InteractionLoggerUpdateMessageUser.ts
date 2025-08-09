/**
 * @file InteractionLoggerUpdateMessageUser.ts
 * @description Сервис, который слушает событие редактирования сообщения и логирует его.
 * ВЕРСИЯ 2.0: Наследует AbstractMessageLogger.
 */
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Message, PartialMessage, EmbedBuilder } from "discord.js";
import { AppEvents } from "@/event.EventBus/app.events";
import { MessageUpdateEvent } from "@/event.EventBus/message-update.event";
import { IInteractionLoggerChannel } from "../abstractions/IInteractionLoggerChannel";

@Injectable()
export class InteractionLoggerUpdateMessageUser extends IInteractionLoggerChannel {
    /**
     * @method onMessageUpdated
     * @description Координирует процесс логирования отредактированного сообщения.
     * @param {MessageUpdateEvent} payload - Данные события.
     */
    @OnEvent(AppEvents.MESSAGE_UPDATED)
    public async onMessageUpdated(payload: MessageUpdateEvent): Promise<void> {
        const { oldMessage, newMessage } = payload;

        if (oldMessage.content === newMessage.content) return;

        if (!this._isLoggable(newMessage)) {
            return;
        }

        const logChannelId = await this._guildConfig.get(
            newMessage.guildId!,
            "logChannelMessageEditId"
        );
        if (!logChannelId) {
            return;
        }

        const logEmbed = await this._createLogEmbed(oldMessage, newMessage);
        await this._sendLog(logChannelId, newMessage.guildId!, logEmbed);
    }

    /**
     * @private
     * @method _createLogEmbed
     * @description Создает встраиваемое сообщение (embed) для лога.
     * @param {Message | PartialMessage} oldMessage - Старое сообщение.
     * @param {Message | PartialMessage} newMessage - Новое сообщение.
     * @returns {Promise<EmbedBuilder>} Готовый embed.
     */
    private async _createLogEmbed(
        oldMessage: Message | PartialMessage,
        newMessage: Message | PartialMessage
    ): Promise<EmbedBuilder> {
        const author = newMessage.author!.partial
            ? await newMessage.author!.fetch()
            : newMessage.author!;

        const oldContent =
            oldMessage.content?.substring(0, 1000) || "Содержимое недоступно.";
        const newContent =
            newMessage.content?.substring(0, 1000) || "Содержимое недоступно.";

        return this._embedFactory.createInfoEmbed({
            title: "Лог: Редактирование сообщения",
            description: `Пользователь **${author.tag}** отредактировал сообщение.`,
            fields: [
                {
                    name: "👤 Автор",
                    value: `**Tag:** ${author.tag}\n**ID:** \`${author.id}\``,
                    inline: true,
                },
                {
                    name: "📍 Канал",
                    value: newMessage.channel.toString(),
                    inline: true,
                },
                {
                    name: "📜 Старое содержимое",
                    value: `\`\`\`${oldContent}\`\`\``,
                    inline: false,
                },
                {
                    name: "📝 Новое содержимое",
                    value: `\`\`\`${newContent}\`\`\``,
                    inline: false,
                },
            ],
            context: { user: author, guild: newMessage.guild! },
        });
    }
}
