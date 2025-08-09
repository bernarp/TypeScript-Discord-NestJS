/**
 * @file InteractionLoggerUpdateMessageUser.ts
 * @description Сервис, который слушает событие редактирования сообщения и логирует его.
 */
import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { IClient } from "@interface/IClient";
import { IGuildConfig } from "@interface/IGuildConfig";
import {
    TextChannel,
    User,
    Message,
    PartialMessage,
    EmbedBuilder,
} from "discord.js";
import { Service } from "@core/abstractions/Service";
import { AppEvents } from "@/event.EventBus/app.events";
import { MessageUpdateEvent } from "@/event.EventBus/message-update.event";

@Injectable()
export class InteractionLoggerUpdateMessageUser extends Service {
    private readonly _logger = new Logger(
        InteractionLoggerUpdateMessageUser.name
    );

    constructor(
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory,
        @Inject("IClient") private readonly _client: IClient,
        @Inject("IGuildConfig") private readonly _guildConfig: IGuildConfig
    ) {
        super();
    }

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
            newMessage.guildId,
            "logChannelMessageEditId"
        );
        if (!logChannelId) {
            return;
        }

        const logEmbed = await this._createLogEmbed(oldMessage, newMessage);
        await this._sendLog(logChannelId, newMessage.guildId, logEmbed);
    }

    /**
     * @private
     * @method _isLoggable
     * @description Проверяет, подлежит ли сообщение логированию.
     * @param {Message | PartialMessage} message - Новое сообщение.
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
