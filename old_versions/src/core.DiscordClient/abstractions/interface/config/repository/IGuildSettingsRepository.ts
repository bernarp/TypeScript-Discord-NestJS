/**
 * @file IGuildSettingsRepository.ts
 * @description Определяет контракт для репозитория, управляющего настройками гильдий.
 * @version 1.2.0
 * @author System
 */

import { IGuildSettings, PinnedMessageConfig } from "@type/IGuildSettings";

export interface IGuildSettingsRepository {
    getGuildSettings(guildId: string): Promise<IGuildSettings | null>;
    getAllGuildSettings(): Promise<[string, IGuildSettings][]>;
    setGuildSettings(
        guildId: string,
        newSettings: Partial<IGuildSettings>
    ): Promise<IGuildSettings>;
    setPinnedMessage(
        guildId: string,
        type: keyof Required<IGuildSettings>["pinnedMessages"],
        config: PinnedMessageConfig
    ): Promise<void>;
    deletePinnedMessage(
        guildId: string,
        type: keyof Required<IGuildSettings>["pinnedMessages"]
    ): Promise<void>;

    /**
     * @method backup
     * @description Создает резервную копию данных, управляемых этим репозиторием.
     * @param {string} [backupName] - Опциональное имя для файла бэкапа.
     * @returns {Promise<string>} Путь к созданному файлу резервной копии.
     */
    backup(backupName?: string): Promise<string>;
}
