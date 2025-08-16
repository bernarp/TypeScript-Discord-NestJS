/**
 * @file ITicketService.ts
 * @description Определяет контракт для сервиса бизнес-логики управления тикетами.
 */

import { GuildMember, TextChannel } from "discord.js";
import { TicketType } from "../enums/TicketType.enum";

export interface ITicketService {
    /**
     * @method createTicket
     * @description Создает новый тикет для пользователя.
     * @param {GuildMember} member - Участник, инициировавший создание тикета.
     * @param {TicketType} type - Тип создаваемого тикета.
     * @returns {Promise<TextChannel>} Созданный текстовый канал тикета.
     * @throws {Error} Если пользователь уже достиг лимита тикетов или настройки неверны.
     */
    createTicket(member: GuildMember, type: TicketType): Promise<TextChannel>;

    /**
     * @method closeTicket
     * @description Закрывает существующий тикет.
     * @param {TextChannel} channel - Канал тикета, который нужно закрыть.
     * @param {GuildMember} member - Участник, инициировавший закрытие.
     * @returns {Promise<void>}
     * @throws {Error} Если канал не является тикетом или у пользователя нет прав.
     */
    closeTicket(channel: TextChannel, member: GuildMember): Promise<void>;

    /**
     * @method addUser
     * @description Добавляет пользователя в существующий тикет.
     * @param {TextChannel} channel - Канал тикета.
     * @param {GuildMember} userToAdd - Пользователь, которого нужно добавить.
     * @param {GuildMember} responsibleMember - Модератор или автор, выполняющий действие.
     * @returns {Promise<void>}
     */
    addUser(
        channel: TextChannel,
        userToAdd: GuildMember,
        responsibleMember: GuildMember
    ): Promise<void>;

    /**
     * @method removeUser
     * @description Удаляет пользователя из существующего тикета.
     * @param {TextChannel} channel - Канал тикета.
     * @param {GuildMember} userToRemove - Пользователь, которого нужно удалить.
     * @param {GuildMember} responsibleMember - Модератор или автор, выполняющий действие.
     * @returns {Promise<void>}
     */
    removeUser(
        channel: TextChannel,
        userToRemove: GuildMember,
        responsibleMember: GuildMember
    ): Promise<void>;
}
