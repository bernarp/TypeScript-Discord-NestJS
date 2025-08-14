/**
 * @file IStorageStrategy.ts
 * @description Определяет контракт для стратегий хранения конфигурации.
 * Абстрагирует физический уровень (файл, БД, память) от логики работы с данными.
 * @version 1.0.0
 * @author System
 */

/**
 * @interface IStorageStrategy<T>
 * @description Контракт для класса, отвечающего за загрузку, сохранение и резервное копирование
 * определенного типа конфигурационных данных.
 * @template T - Тип данных, с которым работает стратегия (например, Map<string, IGuildSettings>).
 */
export interface IStorageStrategy<T> {
    /**
     * @method load
     * @description Асинхронно загружает данные из источника.
     * @returns {Promise<T>} Промис, который разрешается с загруженными данными.
     * @throws {Error} Если источник не найден, поврежден или недоступен.
     */
    load(): Promise<T>;

    /**
     * @method save
     * @description Асинхронно сохраняет данные в источник. Реализация должна гарантировать
     * атомарность операции (например, через временные файлы), чтобы избежать повреждения данных.
     * @param {T} data - Данные для сохранения.
     * @returns {Promise<void>}
     * @throws {Error} Если не удалось выполнить сохранение.
     */
    save(data: T): Promise<void>;

    /**
     * @method backup
     * @description Создает резервную копию текущего состояния данных.
     * @param {string} [backupName] - Опциональное имя для файла бэкапа.
     * @returns {Promise<string>} Путь к созданному файлу резервной копии.
     */
    backup(backupName?: string): Promise<string>;
}
