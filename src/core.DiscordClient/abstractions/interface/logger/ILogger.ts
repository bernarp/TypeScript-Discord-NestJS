/**
 * Интерфейс логгера для записи структурированных логов в файлы.
 * Обеспечивает единообразное API для логирования и совместимость с NestJS LoggerService.
 *
 * @interface ILogger
 * @since 1.1.0
 * @author System
 */
export interface ILogger {
    /**
     * Записывает информационное сообщение.
     * Используется для общей информации о работе системы.
     */
    inf(message: string, context?: Record<string, any>): void;

    /**
     * Записывает отладочное сообщение.
     * Используется для детального трассирования выполнения кода.
     */
    debug(message: string, context?: Record<string, any>): void;

    /**
     * Записывает предупреждение.
     * Используется для потенциально проблемных ситуаций, не критичных для работы.
     */
    warn(message: string, context?: Record<string, any>): void;

    /**
     * Записывает ошибку.
     * Используется для обработанных исключений и ошибочных состояний.
     */
    err(message: string, stack?: string, context?: Record<string, any>): void;

    /**
     * Записывает критическую ошибку и завершает работу приложения.
     */
    fatal(message: string, stack?: string, context?: Record<string, any>): void;

    // --- Методы для совместимости с NestJS LoggerService ---

    /**
     * Обязательный метод для совместимости с NestJS.
     * Обычно перенаправляется на info().
     */
    log(message: string, context?: string): void;

    /**
     * Обязательный метод для совместимости с NestJS.
     * Обычно перенаправляется на debug().
     */
    verbose?(message: string, context?: string): void;
}
