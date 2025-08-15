import { Client } from "discord.js";

/**
 * @interface IClient
 * @description Расширяет стандартный discord.js Client, добавляя кастомные методы для управления жизненным циклом бота.
 * Этот интерфейс позволяет абстрагироваться от конкретной реализации клиента,
 * что упрощает тестирование и возможную замену клиента в будущем.
 * @extends Client
 */
export interface IClient extends Client {
    /**
     * @method start
     * @description Инициализирует и запускает бота. Этот метод должен инкапсулировать
     * логику входа в систему (login) и подписки на основные события.
     * @returns {Promise<void>} Promise, который разрешается после успешного запуска бота.
     */
    start(): Promise<void>;

    /**
     * @method shutdown
     * @description Корректно завершает работу бота. Этот метод должен инкапсулировать
     * логику выхода из системы (logout/destroy) и освобождения всех ресурсов,
     * используемых клиентом.
     * @returns {Promise<void>} Promise, который разрешается после успешного завершения работы.
     */
    shutdown(): Promise<void>;
}
