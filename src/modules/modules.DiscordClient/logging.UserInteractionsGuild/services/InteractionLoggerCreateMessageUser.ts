/**
 * @file InteractionLoggerCreateMessageUser.ts
 * @description Сервис, который слушает событие создания сообщения и логирует его.
 */
import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { IClient } from "@interface/IClient";
import { IGuildConfig } from "@interface/IGuildConfig";
import { TextChannel, User, Message, EmbedBuilder } from "discord.js";
import { Service } from "@core/abstractions/Service";
import { AppEvents } from "@/event.EventBus/app.events";
import { MessageCreateEvent } from "@/event.EventBus/message-create.event";

@Injectable()
export class InteractionLoggerCreateMessageUser extends Service {
    private readonly _logger = new Logger(
        InteractionLoggerCreateMessageUser.name
    );

    constructor(
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory,
        @Inject("IClient") private readonly _client: IClient,
        @Inject("IGuildConfig") private readonly _guildConfig: IGuildConfig
    ) {
        super();
    }

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
            message.guildId,
            "logChannelMessageSendId"
        );
        if (!logChannelId) {
            return;
        }

        const logEmbed = this._createLogEmbed(message);
        await this._sendLog(logChannelId, message.guildId, logEmbed);
    }

    /**
     * @private
     * @method _isLoggable
     * @description Проверяет, подлежит ли сообщение логированию.
     * @param {Message} message - Созданное сообщение.
     * @returns {boolean} True, если сообщение нужно логировать.
     */
    private _isLoggable(message: Message): boolean {
        // Для create события message всегда полный, поэтому проверки на partial не нужны.
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
