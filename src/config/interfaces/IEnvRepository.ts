/**
 * @file IEnvRepository.ts
 * @description Определяет контракт для репозитория, управляющего переменными окружения.
 * @version 1.0.0
 * @author System
 */

/**
 * @interface IEnvRepository
 * @description Контракт для типизированного и безопасного доступа к переменным окружения (.env).
 */
export interface IEnvRepository {
    /**
     * @method getEnv
     * @description Получает значение переменной окружения по ключу.
     * @template T - Ожидаемый тип возвращаемого значения.
     * @param {string} key - Ключ переменной (например, 'TOKEN', 'DATABASE_URL').
     * @param {T} [defaultValue] - Опциональное значение по умолчанию.
     * @returns {T} Значение переменной или defaultValue, если ключ не найден.
     * @throws {Error} Если ключ не найден и defaultValue не предоставлен.
     */
    getEnv<T>(key: string, defaultValue?: T): T;

    /**
     * @method hasEnv
     * @description Проверяет наличие переменной окружения по ключу.
     * @param {string} key - Ключ для проверки.
     * @returns {boolean} true, если ключ существует, иначе false.
     */
    hasEnv(key: string): boolean;
}
