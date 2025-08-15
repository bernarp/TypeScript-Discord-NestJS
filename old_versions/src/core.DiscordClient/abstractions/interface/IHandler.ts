/**
 * @interface IHandler
 * @description Универсальный интерфейс для обработчиков событий или сообщений.
 * Позволяет создавать классы, ответственные за обработку одного конкретного типа данных.
 * Принцип единой ответственности (SRP) в действии.
 * @template T - Тип данных (payload), который будет обрабатывать хендлер.
 *
 * @example
 * // Обработчик взаимодействий может выглядеть так:
 * class InteractionHandler implements IHandler<Interaction> {
 *   public async handle(interaction: Interaction): Promise<void> {
 *     // ... логика обработки
 *   }
 * }
 */
export interface IHandler<T> {
    /**
     * @method handle
     * @description Метод, который выполняет основную логику обработки.
     * @param {T} payload - Данные для обработки (например, объект Interaction, Message и т.д.).
     * @returns {Promise<void>} Promise, который разрешается после завершения обработки.
     */
    handle(payload: T): Promise<void>;
}
