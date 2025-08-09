/**
 * @file IEmbedFactory.ts
 * @description Интерфейс для фабрики эмбедов.
 */

import { ColorResolvable, EmbedBuilder, EmbedField } from "discord.js";

/**
 * @interface CustomEmbedOptions
 * @description Опции для создания полностью кастомного эмбеда.
 */
export interface CustomEmbedOptions {
    /**
     * @property description
     * @description Основной текст (содержимое) эмбеда.
     */
    description: string;

    /**
     * @property title
     * @description Опциональный заголовок.
     */
    title?: string;

    /**
     * @property fields
     * @description Опциональный массив полей для добавления в эмбед.
     */
    fields?: EmbedField[];

    /**
     * @property color
     * @description Опциональный цвет для боковой полосы эмбеда.
     */
    color?: ColorResolvable;

    /**
     * @property author
     * @description Опциональная информация об авторе эмбеда.
     */
    author?: { name: string; iconURL?: string; url?: string };

    /**
     * @property thumbnail
     * @description Опциональный URL для маленького изображения (thumbnail) в углу.
     */
    thumbnail?: string;

    /**
     * @property image
     * @description Опциональный URL для большого изображения в теле эмбеда.
     */
    image?: string;
}

/**
 * @interface IEmbedFactory
 * @description Контракт для сервиса, создающего эмбеды.
 */
export interface IEmbedFactory {
    /**
     * @method create
     * @description **Универсальный конструктор.** Создает кастомный эмбед на основе переданных опций.
     * @param {CustomEmbedOptions} options - Опции для создания эмбеда.
     * @returns {EmbedBuilder} Готовый экземпляр EmbedBuilder.
     */
    create(options: CustomEmbedOptions): EmbedBuilder;

    /**
     * @method createSuccessEmbed
     * @description Создает стандартизированный эмбед для сообщений об успехе.
     * @param {Omit<CustomEmbedOptions, 'color'>} options - Опции для кастомизации эмбеда.
     * @returns {EmbedBuilder} Готовый экземпляр EmbedBuilder.
     */
    createSuccessEmbed(
        options: Omit<CustomEmbedOptions, "color">
    ): EmbedBuilder;

    /**
     * @method createInfoEmbed
     * @description Создает стандартизированный эмбед для информационных сообщений.
     * @param {Omit<CustomEmbedOptions, 'color'>} options - Опции для кастомизации эмбеда.
     * @returns {EmbedBuilder} Готовый экземпляр EmbedBuilder.
     */
    createInfoEmbed(options: Omit<CustomEmbedOptions, "color">): EmbedBuilder;

    /**
     * @method createErrorEmbed
     * @description Создает стандартизированный эмбед для сообщений об ошибках.
     * @param {Omit<CustomEmbedOptions, 'color'>} options - Опции для кастомизации эмбеда.
     * @returns {EmbedBuilder} Готовый экземпляр EmbedBuilder.
     */
    createErrorEmbed(options: Omit<CustomEmbedOptions, "color">): EmbedBuilder;
}
