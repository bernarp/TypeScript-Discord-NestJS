/**
 * @file Ticket.repository.ts
 * @description Реализация репозитория для управления данными об активных тикетах.
 */

import { Inject, Injectable } from "@nestjs/common";
import { ILogger } from "@logger";
import { IStorageStrategy } from "@config/storage/IStorageStrategy";
import { IActiveTicket } from "../interfaces/IActiveTicket";
import { ITicketRepository } from "../interfaces/ITicketRepository";
import { TicketStatus } from "../enums/TicketStatus.enum";

@Injectable()
export class TicketRepository implements ITicketRepository {
    // Key: channelId, Value: IActiveTicket
    private _cache: Map<string, IActiveTicket> = new Map();

    constructor(
        @Inject("ActiveTicketsStorageStrategy")
        private readonly _storage: IStorageStrategy<Map<string, IActiveTicket>>,
        @Inject("ILogger")
        private readonly _logger: ILogger
    ) {}

    /**
     * @method init
     * @description Загружает все активные тикеты из хранилища в кэш.
     */
    public async init(): Promise<this> {
        this._logger.inf(
            "Initializing TicketRepository: loading active tickets into cache..."
        );
        const loadedData = await this._storage.load();
        this._cache =
            loadedData instanceof Map
                ? loadedData
                : new Map(Object.entries(loadedData));
        this._logger.inf(
            `Loaded ${this._cache.size} active tickets into cache.`
        );
        return this;
    }

    /**
     * @inheritdoc
     */
    public async create(
        ticketData: Omit<IActiveTicket, "createdAt" | "status">
    ): Promise<IActiveTicket> {
        const newTicket: IActiveTicket = {
            ...ticketData,
            status: TicketStatus.OPEN,
            createdAt: new Date().toISOString(),
        };

        this._cache.set(newTicket.channelId, newTicket);
        await this._storage.save(this._cache);
        this._logger.inf(
            `New ticket created for user ${newTicket.creatorId} in channel ${newTicket.channelId}.`
        );
        return newTicket;
    }

    /**
     * @inheritdoc
     */
    public async findById(channelId: string): Promise<IActiveTicket | null> {
        return this._cache.get(channelId) ?? null;
    }

    /**
     * @inheritdoc
     */
    public async findByUser(
        userId: string,
        guildId: string
    ): Promise<IActiveTicket[]> {
        const userTickets: IActiveTicket[] = [];
        for (const ticket of this._cache.values()) {
            if (
                ticket.creatorId === userId &&
                ticket.guildId === guildId &&
                ticket.status === TicketStatus.OPEN
            ) {
                userTickets.push(ticket);
            }
        }
        return userTickets;
    }

    /**
     * @inheritdoc
     */
    public async update(
        channelId: string,
        updates: Partial<IActiveTicket>
    ): Promise<IActiveTicket> {
        const existingTicket = this._cache.get(channelId);
        if (!existingTicket) {
            throw new Error(`Ticket with channel ID ${channelId} not found.`);
        }

        const updatedTicket = { ...existingTicket, ...updates };
        this._cache.set(channelId, updatedTicket);
        await this._storage.save(this._cache);
        this._logger.debug(`Ticket ${channelId} has been updated.`);
        return updatedTicket;
    }

    /**
     * @inheritdoc
     */
    public async delete(channelId: string): Promise<void> {
        if (this._cache.has(channelId)) {
            this._cache.delete(channelId);
            await this._storage.save(this._cache);
            this._logger.inf(
                `Ticket data for channel ${channelId} has been deleted.`
            );
        }
    }
}
