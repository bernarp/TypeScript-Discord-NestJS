/**
 * @file embedFooter.ts
 * @description Утилита для генерации футеров для эмбедов.
 */

import { Guild, User } from "discord.js";

/**
 * @interface FooterData
 * @description Структура данных, возвращаемая генератором футера.
 */
export interface FooterData {
    text: string;
    iconURL?: string;
}

/**
 * @class EmbedFooterGenerator
 * @description Класс, отвечающий за создание различных типов футеров для эмбедов.
 */
export class EmbedFooterGenerator {
    /**
     * @constructor
     * @param _botName - Имя бота для использования в футере по умолчанию.
     */
    constructor(private readonly _botName: string) {}

    /**
     * @method forUser
     * @description Создает футер с информацией о пользователе.
     * @param {User} user - Объект пользователя.
     * @returns {FooterData} Данные для футера.
     */
    public forUser(user: User): FooterData {
        return {
            text: `Запрошено: ${user.tag}`,
            iconURL: user.displayAvatarURL(),
        };
    }

    /**
     * @method forGuild
     * @description Создает футер с иконкой гильдии и информацией о пользователе.
     * @param {Guild} guild - Объект гильдии.
     * @param {User} user - Объект пользователя.
     * @returns {FooterData} Данные для футера.
     */
    public forGuild(guild: Guild, user: User): FooterData {
        return {
            text: `Запрошено: ${user.tag}`,
            // Если у гильдии нет иконки, используем аватар пользователя как запасной вариант
            iconURL: guild.iconURL() ?? user.displayAvatarURL(),
        };
    }

    /**
     * @method forBot
     * @description Создает футер с информацией о боте (используется, когда нет контекста).
     * @returns {FooterData} Данные для футера.
     */
    public forBot(): FooterData {
        return {
            text: this._botName,
        };
    }
}
