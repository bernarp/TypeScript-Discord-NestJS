/**
 * @file RequiresPermission.decorator.ts
 * @description Содержит реализацию кастомного декоратора @RequiresPermission.
 * ВЕРСИЯ 2.0: Добавлена поддержка логики AND/OR.
 */

import { SetMetadata } from "@nestjs/common";
import { PermissionNode } from "@settings/permissions.dictionary";

/**
 * @const PERMISSIONS_METADATA_KEY
 * @description Уникальный ключ для хранения метаданных о требуемых правах.
 */
export const PERMISSIONS_METADATA_KEY = "discord:permissions";

/**
 * @interface PermissionRequirements
 * @description Структура для описания требований к правам.
 */
export interface PermissionRequirements {
    /**
     * @property permissions
     * @description Список разрешений для проверки.
     */
    permissions: PermissionNode[];
    /**
     * @property logic
     * @description Тип логической проверки.
     * 'OR' (по умолчанию) - пользователь должен иметь хотя бы ОДНО из прав.
     * 'AND' - пользователь должен иметь ВСЕ перечисленные права.
     */
    logic: "AND" | "OR";
}

/**
 * @decorator @RequiresPermission
 * @description Кастомный декоратор для методов, который прикрепляет к ним метаданные
 * о необходимых для выполнения правах.
 *
 * @example
 * // Логика "ИЛИ" (пользователь должен иметь ИЛИ ticket.create, ИЛИ ticket.admin)
 * @RequiresPermission(Permissions.TICKET_CREATE, Permissions.TICKET_ADMIN)
 *
 * // Логика "И" (пользователь должен иметь И ticket.close, И ticket.manage)
 * @RequiresPermission({
 *   permissions: [Permissions.TICKET_CLOSE, Permissions.TICKET_MANAGE],
 *   logic: 'AND'
 * })
 *
 * @param {PermissionNode[] | PermissionRequirements} args - Либо массив прав (для логики 'OR'),
 * либо объект с настройками для более сложной логики.
 * @returns {CustomDecorator<string>}
 */
export const RequiresPermission = (
    ...args: [PermissionRequirements] | PermissionNode[]
) => {
    let requirements: PermissionRequirements;

    // Определяем, как был вызван декоратор
    if (typeof args[0] === "object" && "permissions" in args[0]) {
        // Вызван с объектом: @RequiresPermission({ permissions: [...], logic: 'AND' })
        requirements = args[0];
    } else {
        // Вызван с массивом прав: @RequiresPermission(perm1, perm2, ...)
        requirements = {
            permissions: args as PermissionNode[],
            logic: "OR", // Логика "ИЛИ" по умолчанию
        };
    }

    return SetMetadata(PERMISSIONS_METADATA_KEY, requirements);
};
