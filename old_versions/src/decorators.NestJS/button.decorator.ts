// src/handlers.Global/decorators/button.decorator.ts

import { SetMetadata } from "@nestjs/common";

/**
 * @const BUTTON_METADATA_KEY
 * @description Уникальный ключ для хранения метаданных, прикрепляемых декоратором @Button().
 */
export const BUTTON_METADATA_KEY = "discord:button_handler";

/**
 * @decorator @Button
 * @description Декоратор для классов, который помечает их как "Обработчик кнопок".
 * Позволяет ButtonManager автоматически обнаруживать и регистрировать все обработчики
 * с помощью NestJS DiscoveryService.
 *
 * @returns {ClassDecorator}
 */
export const Button = () => SetMetadata(BUTTON_METADATA_KEY, true);
