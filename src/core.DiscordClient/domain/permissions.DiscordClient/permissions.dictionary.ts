/**
 * @file permissions.dictionary.ts
 * @description Единый источник правды для всех строк-разрешений (permission nodes) в приложении.
 * Использование этого словаря вместо "магических строк" обеспечивает типобезопасность,
 * автодополнение в IDE и упрощает рефакторинг.
 */

/**
 * @const Permissions
 * @description Объект, содержащий все возможные разрешения, сгруппированные по модулям.
 * Ключи в UPPER_SNAKE_CASE используются для импорта в коде (например, Permissions.TICKET_CREATE).
 * Значения в формате 'module.action' - это строки, которые будут храниться в конфигурации
 * и проверяться в PermissionService.
 */
export const Permissions = {
    /**
     * @permission *
     * @description Предоставляет абсолютно все права. Это wildcard-разрешение.
     * Следует выдавать с предельной осторожностью.
     */
    ADMIN_ALL: "*",

    /**
     * @permission ticket.close
     * @description Позволяет пользователю закрывать свой или чужой тикет.
     */
    TICKET_CLOSE: "ticket.close",
    /**
     * @permission ticket.add_user
     * @description Позволяет добавлять других пользователей в тикет.
     */
    TICKET_ADD_USER: "ticket.add_user",
    /**
     * @permission ticket.remove_user
     * @description Позволяет удалять пользователей из тикета.
     */
    TICKET_REMOVE_USER: "ticket.remove_user",
    /**
     * @permission ticket.delete
     * @description Позволяет полностью удалять тикет и его канал.
     */
    TICKET_DELETE: "ticket.delete",

    // --- Управление конфигурацией сервера (/config) ---
    /**
     * @permission config.view
     * @description Позволяет просматривать текущие настройки сервера через команду /config view.
     */
    CONFIG_VIEW: "config.view",
    /**
     * @permission config.set
     * @description Позволяет изменять базовые настройки сервера (например, каналы логов).
     */
    CONFIG_SET: "config.set",

    // --- Управление системой прав (/config permissions) ---
    /**
     * @permission permissions.view
     * @description Позволяет просматривать список групп прав и их состав.
     */
    PERMISSIONS_VIEW: "permissions.view",
    /**
     * @permission permissions.group.create
     * @description Позволяет создавать новые группы прав.
     */
    PERMISSIONS_GROUP_CREATE: "permissions.group.create",
    /**
     * @permission permissions.group.delete
     * @description Позволяет удалять существующие группы прав.
     */
    PERMISSIONS_GROUP_DELETE: "permissions.group.delete",
    /**
     * @permission permissions.group.assign_role
     * @description Позволяет добавлять и удалять роли Discord в/из группы прав.
     */
    PERMISSIONS_GROUP_ASSIGN_ROLE: "permissions.group.assign_role",
    /**
     * @permission permissions.group.grant
     * @description Позволяет выдавать (grant) и отзывать (revoke) конкретные разрешения для группы.
     */
    PERMISSIONS_GROUP_GRANT: "permissions.group.grant",
    /**
     * @permission permissions.group.set_inheritance
     * @description Позволяет изменять, от каких групп наследуется текущая группа.
     */
    PERMISSIONS_GROUP_SET_INHERITANCE: "permissions.group.set_inheritance",
} as const; 

/**
 * @type PermissionNode
 * @description Утилитарный тип, представляющий собой объединение всех возможных строковых значений разрешений.
 * Позволяет использовать строгую типизацию в методах, принимающих строку-разрешение.
 * @example
 * function checkPermission(permission: PermissionNode) { ... }
 * // Вызов checkPermission('ticket.create') будет валидным.
 * // Вызов checkPermission('несуществующее.право') вызовет ошибку компиляции.
 */
export type PermissionNode = (typeof Permissions)[keyof typeof Permissions];
