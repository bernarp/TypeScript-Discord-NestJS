/**
 * Уровни логирования в порядке возрастания критичности
 *
 * @typedef LogLevel
 * @since 1.0.0
 */
export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

/**
 * Интерфейс записи лога для сериализации в JSON
 * Определяет структуру объекта, который будет записан в файл лога
 *
 * @interface ILogEntry
 * @since 1.0.0
 * @author System
 */
export interface ILogEntry {
    /**
     * Временная метка создания записи лога в формате ISO 8601
     * Генерируется автоматически при создании записи
     *
     * @example "2025-08-13T15:30:45.123Z"
     */
    timestamp: string;

    /**
     * Уровень критичности лога
     * Определяет важность сообщения и влияет на выбор файла для записи
     */
    level: LogLevel;

    /**
     * Основное текстовое сообщение лога
     * Должно быть информативным и понятным для разработчика
     */
    message: string;

    /**
     * Абсолютный путь к файлу, из которого был вызван логгер
     * Определяется автоматически через анализ стека вызовов
     *
     * @optional
     * @example "/home/user/project/src/services/user.service.ts"
     */
    filePath?: string;

    /**
     * Номер строки в файле, откуда был вызван логгер
     * Определяется автоматически через анализ стека вызовов
     *
     * @optional
     * @example 42
     */
    lineNumber?: number;

    /**
     * Имя метода или функции, из которой был вызван логгер
     * Определяется автоматически через анализ стека вызовов
     *
     * @optional
     * @example "authenticateUser" или "UserService.authenticateUser"
     */
    methodName?: string;

    /**
     * Стек вызовов для ошибок
     * Заполняется только для уровней ERROR и FATAL
     * Содержит полную трассировку выполнения до момента ошибки
     *
     * @optional
     * @example
     * ```
     * "Error: Connection failed
     *     at Database.connect (/app/database.js:45:13)
     *     at UserService.getUser (/app/user.service.js:23:8)"
     * ```
     */
    stack?: string;

    /**
     * Дополнительные структурированные данные
     * Произвольный объект с контекстной информацией
     * Может содержать ID пользователя, ID гильдии, параметры запроса и т.д.
     *
     * @optional
     * @example
     * ```
     * {
     *   "userId": "123456789",
     *   "guildId": "987654321",
     *   "command": "play",
     *   "duration": 1250
     * }
     * ```
     */
    context?: Record<string, any>;
}

/**
 * Тип для определения конфигурации логгера
 * Содержит базовые настройки для инициализации сервиса логирования
 *
 * @interface ILoggerConfig
 * @since 1.0.0
 */
export interface ILoggerConfig {
    /**
     * Базовая директория для хранения логов
     * По умолчанию "./logs"
     *
     * @default "./logs"
     */
    baseLogDirectory?: string;

    /**
     * Формат имени директории для логов текущей сессии
     * По умолчанию используется ISO timestamp запуска приложения
     *
     * @default "YYYY-MM-DDTHH-mm-ssZ"
     */
    sessionDirectoryFormat?: string;

    /**
     * Имя файла для обычных логов (INFO, DEBUG, WARN)
     *
     * @default "logs.log"
     */
    generalLogFileName?: string;

    /**
     * Имя файла для логов ошибок (ERROR, FATAL)
     *
     * @default "error.log"
     */
    errorLogFileName?: string;
}
