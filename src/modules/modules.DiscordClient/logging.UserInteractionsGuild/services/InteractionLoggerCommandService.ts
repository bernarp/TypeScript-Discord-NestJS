/**
 * @file InteractionLoggerService.ts
 * @description Сервис, который слушает события создания взаимодействия и логирует их.
 * ВЕРСИЯ 3.0: Наследует базовый класс Service.
 */
import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InteractionCreateEvent } from "@event.EventBus/interaction-create.event";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { IClient } from "@interface/IClient";
import { IConfig } from "@interface/IConfig";
import { TextChannel, ChannelType } from "discord.js";
import { Service } from "@core/abstractions/Service";
import { AppEvents } from "@/event.EventBus/app.events";

@Injectable()
export class InteractionLoggerCommandService extends Service {
    private readonly _logger = new Logger(InteractionLoggerCommandService.name);

    /**
     * @constructor
     */
    constructor(
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory,
        @Inject("IClient") private readonly _client: IClient,
        @Inject("IConfig") private readonly _config: IConfig
    ) {
        super();
    }

    /**
     * @method onInteractionCreated
     * @description Этот метод автоматически вызывается, когда происходит событие 'interaction.created'.
     * @param {InteractionCreateEvent} payload - Данные события.
     */
    @OnEvent(AppEvents.INTERACTION_CREATED_COMMAND)
    async onInteractionCreated(payload: InteractionCreateEvent): Promise<void> {
        const { interaction } = payload;
        const { user, channel, commandName, guild, commandId, channelId } =
            interaction;

        const logContext = {
            command: {
                name: `/${commandName}`,
                id: commandId,
            },
            user: {
                tag: user.tag,
                id: user.id,
            },
            source: {
                type: interaction.inGuild() ? "Guild" : "DM",
                guild: interaction.inGuild()
                    ? { name: guild?.name, id: guild?.id }
                    : undefined,
                channel: {
                    type: ChannelType[channel?.type ?? 0],
                    id: channelId,
                },
            },
        };

        this._logger.log(`Command executed`, logContext);

        const logEmbed = this._embedFactory.createInfoEmbed({
            title: "Лог выполнения команды",
            description: `Пользователь **${user.tag}** вызвал команду **/${commandName}**.`,
            fields: [
                {
                    name: "👤 Пользователь",
                    value: `**Tag:** ${user.tag}\n**ID:** \`${user.id}\``,
                    inline: true,
                },
                {
                    name: "📍 Место вызова",
                    value: interaction.inGuild()
                        ? `**Сервер:** ${
                              guild?.name
                          }\n**Канал:** ${channel?.toString()}`
                        : "Личные сообщения",
                    inline: true,
                },
                {
                    name: "🔧 Детали команды",
                    value: `**ID Команды:** \`${commandId}\`\n**ID Канала:** \`${channelId}\``,
                    inline: false,
                },
            ],
            context: { user, guild },
        });

        const logChannelId = this._config.get<string>("LOG_CHANNEL_ID");
        if (!logChannelId) {
            this._logger.warn(
                "LOG_CHANNEL_ID is not set. Skipping log message to Discord."
            );
            return;
        }

        try {
            const logChannel = await this._client.channels.fetch(logChannelId);
            if (logChannel instanceof TextChannel) {
                await logChannel.send({ embeds: [logEmbed] });
            } else {
                this._logger.warn(
                    `Channel ${logChannelId} is not a valid text channel.`
                );
            }
        } catch (error) {
            this._logger.error(
                `Failed to send log message to channel ${logChannelId}:`,
                error
            );
        }
    }

    // TODO: Если этому сервису потребуется какая-либо логика инициализации
    // (например, проверка доступности канала логов при старте),
    // можно переопределить метод init.
    /*
    public override init(): void {
        this._logger.log("Initializing InteractionLoggerService...");
        // какая-то логика...
    }
    */
}
