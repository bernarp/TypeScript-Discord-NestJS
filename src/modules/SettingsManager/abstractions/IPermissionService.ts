/**
 * @file IPermissionService.ts
 * @description Определяет контракт для сервиса проверки прав доступа.
 * ВЕРСИЯ 2.0: Добавлен метод для инвалидации кэша.
 */
import { GuildMember } from "discord.js";
import { PermissionNode } from "@settings/permissions.dictionary";

export interface IPermissionService {
    /**
     * @method check
     * @description Проверяет, имеет ли указанный участник гильдии необходимое разрешение.
     * Этот метод должен инкапсулировать всю логику, включая проверку ролей,
     * наследование прав от других групп и обработку wildcard-разрешений ('*').
     * @param {GuildMember} member - Участник гильдии, чьи права проверяются.
     * @param {PermissionNode} permission - Строка-разрешение для проверки.
     * @returns {Promise<boolean>} True, если право есть, иначе false.
     */
    check(member: GuildMember, permission: PermissionNode): Promise<boolean>;

    /**
     * @method invalidateCache
     * @description Сбрасывает кэш прав для всей гильдии или для конкретного пользователя.
     * Этот метод необходимо вызывать после любого изменения в группах прав или ролях,
     * чтобы гарантировать, что сервис будет работать с актуальными данными.
     * @param {string} guildId - ID гильдии, для которой сбрасывается кэш.
     * @param {string} [userId] - Опциональный ID пользователя. Если указан, кэш сбрасывается только для него.
     * @returns {void}
     */
    invalidateCache(guildId: string, userId?: string): void;
}
