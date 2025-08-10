/**
 * @file InteractionLoggerService.ts
 * @description Сервис, который слушает события создания взаимодействия и логирует их.
 * ВЕРСИЯ 4.1: Исправлена критическая ошибка, связанная с некорректным вызовом логгера.
 */
import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InteractionCreateEvent } from "@event.EventBus/interaction-create.event";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { IClient } from "@interface/IClient";
import { IConfig } from "@interface/IConfig";
import { ChannelType, EmbedBuilder } from "discord.js";
import { AppEvents } from "@/event.EventBus/app.events";
import { IInteractionLoggerChannel } from "../abstractions/IInteractionLoggerChannel";
import { IGuildConfig } from "@interface/IGuildConfig";

@Injectable()
export class InteractionLoggerCommandUse extends IInteractionLoggerChannel {
    /**
     * @constructor
     */
    constructor(
        @Inject("IEmbedFactory")
        protected readonly _embedFactory: IEmbedFactory,
        @Inject("IClient") protected readonly _client: IClient,
        @Inject("IGuildConfig") protected readonly _guildConfig: IGuildConfig,
        @Inject("IConfig") private readonly _config: IConfig
    ) {
        super(_embedFactory, _client, _guildConfig);
    }

    /**
     * @method onInteractionCreated
     * @description Этот метод автоматически вызывается, когда происходит событие 'interaction.created'.
     * @param {InteractionCreateEvent} payload - Данные события.
     */
    @OnEvent(AppEvents.INTERACTION_CREATED_COMMAND)
    async onInteractionCreated(payload: InteractionCreateEvent): Promise<void> {
        const { interaction } = payload;
        this._logToConsole(interaction);

        const logChannelId = this._config.get<string>("LOG_CHANNEL_ID");
        if (!logChannelId) {
            this._logger.warn(
                "LOG_CHANNEL_ID is not set. Skipping log message to Discord."
            );
            return;
        }

        const logEmbed = this._createLogEmbed(interaction);

        await this._sendLog(
            logChannelId,
            interaction.guild?.id ?? "DM",
            logEmbed
        );

        // ИЗМЕНЕНИЕ: Удалена строка, вызывавшая критическую ошибку.
        // this._logger.log(this._sendLog);

        // Вместо этого можно добавить осмысленное сообщение в режиме отладки.
        this._logger.debug(
            `Command usage log for /${interaction.commandName} has been sent to channel ${logChannelId}.`
        );
    }

    /**
     * @private
     * @method _createLogEmbed
     * @description Создает встраиваемое сообщение (embed) для лога команды.
     * @param {InteractionCreateEvent["interaction"]} interaction - Взаимодействие.
     * @returns {EmbedBuilder} Готовый embed.
     */
    private _createLogEmbed(
        interaction: InteractionCreateEvent["interaction"]
    ): EmbedBuilder {
        const { user, channel, commandName, guild, commandId, channelId } =
            interaction;

        return this._embedFactory.createInfoEmbed({
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
    }

    /**
     * @private
     * @method _logToConsole
     * @description Выносит логику записи в консоль в отдельный метод для чистоты.
     * @param {InteractionCreateEvent["interaction"]} interaction - Взаимодействие.
     */
    private _logToConsole(
        interaction: InteractionCreateEvent["interaction"]
    ): void {
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
    }
}
