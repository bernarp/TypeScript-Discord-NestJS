/**
 * @file TicketTranscript.service.ts
 * @description Сервис для сбора и записи транскриптов активных тикетов.
 * @version 1.1.0: Added user ID to transcript log lines.
 */

import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { AppEvents } from "@events/app.events";
import { MessageCreateEvent } from "@events/message-create.event";
import { ILogger } from "@logger";
import { ITicketRepository } from "../interfaces/ITicketRepository";
import * as fs from "fs/promises";
import * as path from "path";

@Injectable()
export class TicketTranscriptService {
    private readonly _transcriptDir = path.join(
        process.cwd(),
        "tmp",
        "transcripts"
    );

    constructor(
        @Inject("ITicketRepository")
        private readonly _ticketRepo: ITicketRepository,
        @Inject("ILogger") private readonly _logger: ILogger
    ) {
        this._ensureDirectoryExists();
    }

    @OnEvent(AppEvents.MESSAGE_CREATED)
    public async onMessageCreate(payload: MessageCreateEvent): Promise<void> {
        const { message } = payload;

        if (message.author.bot || !message.inGuild()) {
            return;
        }

        const ticket = await this._ticketRepo.findById(message.channel.id);
        if (!ticket) {
            return;
        }

        const transcriptPath = path.join(
            this._transcriptDir,
            `${message.channel.id}.log`
        );

        const logLine = `[${new Date(
            message.createdTimestamp
        ).toLocaleString()}] ${message.author.tag} (${message.author.id}): ${
            message.content
        }\n`;
        try {
            await fs.appendFile(transcriptPath, logLine);
        } catch (error) {
            this._logger.err(
                `Failed to write to transcript file for ticket ${message.channel.id}`,
                error.stack
            );
        }
    }

    private async _ensureDirectoryExists(): Promise<void> {
        try {
            await fs.mkdir(this._transcriptDir, { recursive: true });
        } catch (error) {
            this._logger.fatal(
                `Could not create transcript directory at ${this._transcriptDir}`,
                error.stack
            );
        }
    }
}
