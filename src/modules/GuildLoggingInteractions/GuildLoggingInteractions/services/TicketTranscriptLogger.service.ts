/**
 * @file TicketTranscriptLogger.service.ts
 * @description Сервис для обработки и логирования транскриптов закрытых тикетов.
 * @version 1.2.0: Added participants list to the log embed.
 */

import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { AppEvents } from "@events/app.events";
import { TicketClosedEvent } from "@events/ticket-closed.event";
import { ILogger } from "@logger";
import { IClient } from "@client";
import { IEmbedFactory } from "@interfaces/IEmbedFactory";
import { IConfigurationService } from "@settings/abstractions/IConfigurationService";
import { AttachmentBuilder, TextChannel } from "discord.js";
import * as fs from "fs/promises";

@Injectable()
export class TicketTranscriptLogger {
    constructor(
        @Inject("IClient") private readonly _client: IClient,
        @Inject("IConfigurationService")
        private readonly _configService: IConfigurationService,
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory,
        @Inject("ILogger") private readonly _logger: ILogger
    ) {}

    @OnEvent(AppEvents.TICKET_CLOSED)
    public async onTicketClosed(payload: TicketClosedEvent): Promise<void> {
        this._logger.inf(
            `Received ticket.closed event for channel ${payload.channelName}. Processing transcript...`
        );

        const settings = await this._configService.guilds.getGuildSettings(
            payload.guildId
        );
        const logChannelId =
            settings?.logChannelTicketTranscriptsId || settings?.logChannelId;

        if (!logChannelId) {
            this._logger.warn(
                `No log channel configured for guild ${payload.guildId}. Transcript for ticket ${payload.channelName} will not be logged.`
            );
            await this._cleanupTranscriptFile(payload.transcriptFilePath);
            return;
        }

        try {
            const channel = await this._client.channels.fetch(logChannelId);
            if (!channel || !(channel instanceof TextChannel)) {
                this._logger.warn(
                    `Log channel ${logChannelId} not found or is not a text channel for guild ${payload.guildId}.`
                );
                await this._cleanupTranscriptFile(payload.transcriptFilePath);
                return;
            }

            const transcriptContent = await fs.readFile(
                payload.transcriptFilePath,
                "utf-8"
            );
            const attachment = new AttachmentBuilder(
                Buffer.from(transcriptContent, "utf-8"),
                {
                    name: `${payload.channelName}-transcript.log`,
                }
            );

            // VVV НОВЫЙ БЛОК: Извлечение участников из транскрипта VVV
            const participantIds =
                this._extractParticipantIds(transcriptContent);
            const participantsString =
                participantIds.map((id) => `<@${id}>`).join(", ") ||
                "Нет сообщений";
            // ^^^ КОНЕЦ НОВОГО БЛОКА ^^^

            const embed = this._embedFactory.createInfoEmbed({
                title: "Транскрипт тикета закрыт",
                description: `Запись переписки из тикета \`${payload.channelName}\` прикреплена к этому сообщению.`,
                fields: [
                    {
                        name: "Создатель тикета",
                        value: `${payload.creator.tag} (\`${payload.creator.id}\`)`,
                        inline: true,
                    },
                    {
                        name: "Закрыл тикет",
                        value: `${payload.closer.tag} (\`${payload.closer.id}\`)`,
                        inline: true,
                    },
                    {
                        name: "Время создания",
                        value: `<t:${Math.floor(
                            new Date(payload.createdAt).getTime() / 1000
                        )}:f>`,
                        inline: false,
                    },
                    {
                        name: "Участники переписки",
                        value: participantsString,
                        inline: false,
                    },
                ],
                context: {
                    user: payload.closer,
                    guild: await this._client.guilds.fetch(payload.guildId),
                },
            });

            await channel.send({
                embeds: [embed],
                files: [attachment],
            });

            this._logger.inf(
                `Successfully logged transcript for ticket ${payload.channelName} to channel ${logChannelId}.`
            );
        } catch (error) {
            this._logger.err(
                `Failed to process and log transcript for ticket ${payload.channelName}:`,
                error.stack
            );
        } finally {
            await this._cleanupTranscriptFile(payload.transcriptFilePath);
        }
    }

    private async _cleanupTranscriptFile(filePath: string): Promise<void> {
        try {
            await fs.unlink(filePath);
            this._logger.debug(`Cleaned up transcript file: ${filePath}`);
        } catch (error) {
            if (error.code !== "ENOENT") {
                this._logger.warn(
                    `Could not clean up transcript file ${filePath}:`,
                    error.stack
                );
            }
        }
    }

    /**
     * @private
     * @method _extractParticipantIds
     * @description Извлекает все уникальные ID пользователей из файла транскрипта.
     * @param {string} content - Содержимое файла транскрипта.
     * @returns {string[]} Массив уникальных ID пользователей.
     */
    private _extractParticipantIds(content: string): string[] {
        const regex = /\((\d{17,19})\):/g;
        const matches = content.matchAll(regex);
        const ids = new Set<string>();
        for (const match of matches) {
            ids.add(match[1]);
        }
        return Array.from(ids);
    }
}
