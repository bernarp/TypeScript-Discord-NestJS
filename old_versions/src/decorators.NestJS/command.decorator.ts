/**
 * @file command.decorator.ts
 * @description Содержит реализацию кастомного декоратора @Command, предназначенного
 * для маркировки классов как исполняемых команд бота.
 */

import { SetMetadata } from "@nestjs/common";

/**
 * @const COMMAND_METADATA_KEY
 * @description Уникальный ключ (символ) для хранения метаданных, которые прикрепляются
 * декоратором @Command к классу. Использование константы предотвращает ошибки,
 * связанные с опечатками в строковых ключах, и обеспечивает централизованное
 * управление ключом метаданных.
 */
export const COMMAND_METADATA_KEY = "discord:command";

/**
 * @decorator @Command
 * @description Кастомный декоратор для классов, который помечает их как "Команды".
 * Он прикрепляет к классу метаданные с помощью функции SetMetadata из @nestjs/common.
 *
 * В будущем это позволит с помощью NestJS DiscoveryService автоматически находить все
 * классы, помеченные этим декоратором, и регистрировать их в системе.
 *
 * @example
 * import { Command } from '@decorators/command.decorator';
 *
 * @Command()
 * @Injectable()
 * export class PingCommand implements ICommand {
 *   // ... реализация команды
 * }
 *
 * @returns {ClassDecorator} Возвращает декоратор класса.
 */
export const Command = () => SetMetadata(COMMAND_METADATA_KEY, true);
