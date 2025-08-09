/**
 * @file emit-event.decorator.ts
 * @description Содержит реализацию кастомного декоратора @EmitEvent.
 * ВЕРСИЯ 2.0: Поддерживает универсальную генерацию событий.
 */

import { SetMetadata } from "@nestjs/common";

export const EMIT_EVENT_METADATA_KEY = "event-emitter:emit_event";

/**
 * @interface EmitEventOptions
 * @description Опции для декоратора @EmitEvent, описывающие, как создать событие.
 */
export interface EmitEventOptions {
    /**
     * @property eventName
     * @description Имя события из AppEvents.
     */
    eventName: string;

    /**
     * @property eventClass
     * @description Ссылка на класс события, экземпляр которого нужно создать (например, InteractionCreateEvent).
     */
    eventClass: new (...args: any[]) => any;

    /**
     * @property payloadFactory
     * @description Функция, которая принимает массив аргументов оригинального метода
     * и возвращает массив аргументов для конструктора eventClass.
     * @param {any[]} args - Аргументы, с которыми был вызван декорированный метод.
     * @returns {any[]} Аргументы для конструктора класса события.
     */
    payloadFactory: (args: any[]) => any[];
}

/**
 * @decorator @EmitEvent
 * @description Декоратор для методов, который автоматически генерирует событие
 * ПОСЛЕ успешного выполнения этого метода.
 * @param {EmitEventOptions} options - Опции для генерации события.
 */
export const EmitEvent = (options: EmitEventOptions): MethodDecorator =>
    SetMetadata(EMIT_EVENT_METADATA_KEY, options);
