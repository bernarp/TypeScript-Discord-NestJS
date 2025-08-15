/**
 * @file IEmbedFactory.ts
 * @description Интерфейс для фабрики эмбедов.
 */

import {
    ColorResolvable,
    EmbedBuilder,
    EmbedField,
    User,
    Guild,
} from "discord.js";

/**
 * @interface EmbedContext
 * @description Контекстная информация для генерации динамических частей эмбеда, например, футера.
 */
export interface EmbedContext {
    /**
     * @property user
     * @description Пользователь, инициировавший действие (например, вызвавший команду).
     */
    user: User;
    /**
     * @property guild
     * @description Опциональная гильдия, в контексте которой происходит действие.
     * ИСПРАВЛЕНИЕ: Имя свойства было 'userid', исправлено на 'guild' для соответствия типу.
     */
    guild?: Guild | null;
}

/**
 * @interface CustomEmbedOptions
 * @description Опции для создания полностью кастомного эмбеда.
 */
export interface CustomEmbedOptions {
    description: string;
    title?: string;
    fields?: EmbedField[];
    color?: ColorResolvable;
    author?: { name: string; iconURL?: string; url?: string };
    thumbnail?: string;
    image?: string;
    context?: EmbedContext;
}

/**
 * @type EmbedStencilOptions
 * @description ИЗМЕНЕНИЕ: Теперь это просто псевдоним для CustomEmbedOptions.
 * Логика игнорирования title и color будет внутри реализации фабрики.
 * Это делает использование фабрики более гибким, предотвращая ошибки компиляции.
 */
export type EmbedStencilOptions = CustomEmbedOptions;

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
     * @param {EmbedStencilOptions} options - Опции для кастомизации эмбеда.
     * @returns {EmbedBuilder} Готовый экземпляр EmbedBuilder.
     */
    createSuccessEmbed(options: EmbedStencilOptions): EmbedBuilder;

    /**
     * @method createInfoEmbed
     * @description Создает стандартизированный эмбед для информационных сообщений.
     * @param {EmbedStencilOptions} options - Опции для кастомизации эмбеда.
     * @returns {EmbedBuilder} Готовый экземпляр EmbedBuilder.
     */
    createInfoEmbed(options: EmbedStencilOptions): EmbedBuilder;

    /**
     * @method createErrorEmbed
     * @description Создает стандартизированный эмбед для сообщений об ошибках.
     * @param {EmbedStencilOptions} options - Опции для кастомизации эмбеда.
     * @returns {EmbedBuilder} Готовый экземпляр EmbedBuilder.
     */
    createErrorEmbed(options: EmbedStencilOptions): EmbedBuilder;
}
