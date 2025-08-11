/**
 * @file BaseInteractionLogger.abstract.ts
 * @description Базовый абстрактный класс для логгеров взаимодействий.
 */

import { Inject, Injectable, Logger } from "@nestjs/common";
import { BaseInteraction, EmbedBuilder, TextChannel } from "discord.js";
import { Service } from "@core/abstractions/Service";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { IClient } from "@interface/IClient";
import { IGuildConfig } from "@interface/IGuildConfig";
import { IInteractionLogger } from "../interfaces/IInteractionLogger.interface";
import { LogChannelType } from "../LogChannelType.enum";

@Injectable()
export abstract class BaseInteractionLogger
    extends Service
    implements IInteractionLogger
{
    protected readonly _logger: Logger;

    constructor(
        @Inject("IEmbedFactory")
        protected readonly _embedFactory: IEmbedFactory,
        @Inject("IClient")
        protected readonly _client: IClient,
        @Inject("IGuildConfig")
        protected readonly _guildConfig: IGuildConfig
    ) {
        super();
        this._logger = new Logger(this.constructor.name);
    }

    /**
     * @abstract
     * @method onInteractionCreated
     * @description Обрабатывает событие создания взаимодействия.
     */
    public abstract onInteractionCreated(payload: any): Promise<void>;

    /**
     * @abstract
     * @method createLogEmbed
     * @description Создает embed для логирования взаимодействия.
     */
    public abstract createLogEmbed(interaction: BaseInteraction): EmbedBuilder;

    /**
     * @protected
     * @method getLogChannelId
     * @description Получает ID канала логирования для указанного типа.
     * @param {string} guildId - ID гильдии.
     * @param {LogChannelType} channelType - Тип канала логирования.
     * @returns {Promise<string | undefined>}
     */
    protected async getLogChannelId(
        guildId: string,
        channelType: LogChannelType
    ): Promise<string | undefined> {
        return (await this._guildConfig.get(guildId, channelType)) as
            | string
            | undefined;
    }

    /**
     * @protected
     * @method sendLog
     * @description Отправляет embed в канал логирования.
     * @param {string} channelId - ID канала.
     * @param {string} guildId - ID гильдии.
     * @param {EmbedBuilder} embed - Embed для отправки.
     * @returns {Promise<void>}
     */
    protected async sendLog(
        channelId: string,
        guildId: string,
        embed: EmbedBuilder
    ): Promise<void> {
        try {
            const logChannel = await this._client.channels.fetch(channelId);

            if (!(logChannel instanceof TextChannel)) {
                this._logger.warn(
                    `Channel ${channelId} is not a text channel for guild ${guildId}.`
                );
                return;
            }

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            this._logger.error(
                `Failed to send log message to channel ${channelId} for guild ${guildId}:`,
                error
            );
        }
    }

    /**
     * @protected
     * @method isInteractionLoggable
     * @description Проверяет, подлежит ли взаимодействие логированию.
     * @param {BaseInteraction} interaction - Взаимодействие для проверки.
     * @returns {boolean}
     */
    protected isInteractionLoggable(interaction: BaseInteraction): boolean {
        return !!(
            interaction.inGuild() &&
            interaction.user &&
            !interaction.user.bot
        );
    }
}
