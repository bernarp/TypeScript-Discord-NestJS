/**
 * @file Handler.ts
 * @description Содержит абстрактный базовый класс для всех обработчиков.
 */

import { IHandler } from "./interface/IHandler";

/**
 * @abstract
 * @class Handler
 * @description Базовый абстрактный класс, реализующий интерфейс IHandler.
 * Он определяет, что любой обработчик должен иметь метод handle.
 * @template T - Тип данных (payload), который будет обрабатывать хендлер.
 * @implements {IHandler<T>}
 */
export abstract class Handler<T> implements IHandler<T> {
    /**
     * @public
     * @abstract
     * @method handle
     * @description Абстрактный метод для обработки входящих данных.
     * Каждый конкретный класс-обработчик должен предоставить свою реализацию этого метода.
     * @param {T} payload - Данные для обработки.
     * @returns {Promise<void>}
     */
    public abstract handle(payload: T): Promise<void>;
}
