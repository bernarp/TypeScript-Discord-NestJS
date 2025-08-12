# Руководство: Создание нового модуля (Неактуально.)

Этот гайд описывает процесс создания нового функционального модуля на примере команды `/kick`.

## Шаг 1: Создание структуры файлов

Создайте следующую структуру в `src/modules/modules.DiscordClient/`:

```
moderation/
├── commands/
│   ├── Kick.command.ts
│   └── PunishmentGet.command.ts
├── services/
│   └── Moderation.service.ts
├── interfaces/
│   └── IModerationService.ts
└── moderation.module.ts
```


## Шаг 2: Определение права доступа

Добавьте новое право в глобальный словарь `permissions.dictionary.ts`:

```typescript
// src/core.DiscordClient/domain/permissions.DiscordClient/permissions.dictionary.ts
export const Permissions = {
    // ...
    MODERATION_KICK: "moderation.kick",
    MODERATION_VIEW_PUNISHMENTS: "moderation.view_punishments",
    // ...
} as const;
```


## Шаг 3: Создание интерфейса сервиса

**`moderation/interfaces/IModerationService.ts`**

```typescript
import { GuildMember } from "discord.js";

// Для SQL датабаз лучше сущности прописывать в ./core.DiscordClient/domain... Но тут он прописан просто как пример.
export interface PunishmentRecord {
    id: string;
    userId: string;
    moderatorId: string;
    type: 'kick' | 'ban' | 'warn' | 'mute';
    reason: string;
    timestamp: Date;
    duration?: number;
    active: boolean;
}

export interface IModerationService {
    kickMember(member: GuildMember, reason: string): Promise<void>;
    getPunishment(guildId: string, punishmentId: string): Promise<PunishmentRecord | null>;
    getAllPunishments(guildId: string, userId: string): Promise<PunishmentRecord[]>;
}
```


## Шаг 4: Создание сервиса (Бизнес-логика)

**`moderation/services/Moderation.service.ts`**

```typescript
import { Inject, Injectable, Logger } from "@nestjs/common";
import { GuildMember } from "discord.js";
import { IGuildConfig } from "@interface/IGuildConfig";
import { Service } from "@core/abstractions/Service";
import { IModerationService, PunishmentRecord } from "../interfaces/IModerationService";

@Injectable()
export class ModerationService extends Service implements IModerationService {
    private readonly _logger = new Logger(ModerationService.name);

    constructor(
        @Inject("IGuildConfig")
        private readonly _guildConfig: IGuildConfig
    ) {
        super();
    }

    public async kickMember(member: GuildMember, reason: string): Promise<void> {
        if (!member.kickable) {
            throw new Error("Недостаточно прав для кика этого участника.");
        }

        await member.kick(reason);
        this._logger.log(`Kicked ${member.user.tag} for: ${reason}`);

        // Логирование в канал
        const logChannelId = await this._guildConfig.get<string>(
            member.guild.id,
            "logChannelId"
        );
        // ...дальнейшая логика отправки лога
    }

    public async getPunishment(guildId: string, punishmentId: string): Promise<PunishmentRecord | null> {
        // Здесь должна быть логика получения наказания из базы данных
        // Пример заглушки:
        return {
            id: punishmentId,
            userId: "123456789",
            moderatorId: "987654321",
            type: 'kick',
            reason: "Нарушение правил",
            timestamp: new Date(),
            active: true
        };
    }

    public async getAllPunishments(guildId: string, userId: string): Promise<PunishmentRecord[]> {
        // Здесь должна быть логика получения всех наказаний пользователя из базы данных
        // Пример заглушки:
        return [];
    }
}
```


## Шаг 5: Создание команд

**`moderation/commands/Kick.command.ts`**

```typescript
import { Inject, Injectable } from "@nestjs/common";
import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { Command } from "@decorators/command.decorator";
import { ICommand } from "@interface/ICommand";
import { RequiresPermission } from "@decorators/RequiresPermission.decorator";
import { Permissions } from "@permissions/permissions.dictionary";
import { IModerationService } from "../interfaces/IModerationService";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";

@Command()
@Injectable()
export class KickCommand implements ICommand {
    public readonly data = new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Выгоняет участника с сервера.")
        .addUserOption(option =>
            option.setName("участник").setDescription("Участник для кика").setRequired(true)
        )
        .addStringOption(option =>
            option.setName("причина").setDescription("Причина кика").setRequired(false)
        );

    constructor(
        @Inject("IModerationService")
        private readonly _moderationService: IModerationService,
        @Inject("IEmbedFactory")
        private readonly _embedFactory: IEmbedFactory
    ) {}

    @RequiresPermission(Permissions.MODERATION_KICK)
    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const targetUser = interaction.options.getUser("участник", true);
        const reason = interaction.options.getString("причина") ?? "Причина не указана";
        await this._moderationService.kickMember(
            await interaction.guild.members.fetch(targetUser.id), 
            reason
        );
        await interaction.reply("Участник успешно выгнан!");
    }
}
```

**`moderation/commands/PunishmentGet.command.ts`**

```typescript
import { Inject, Injectable } from "@nestjs/common";
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "@decorators/command.decorator";
import { ICommand } from "@interface/ICommand";
import { RequiresPermission } from "@decorators/RequiresPermission.decorator";
import { Permissions } from "@permissions/permissions.dictionary";
import { IModerationService } from "../interfaces/IModerationService";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";

@Command()
@Injectable()
export class PunishmentGetCommand implements ICommand {
    public readonly data = new SlashCommandBuilder()
        .setName("punishment")
        .setDescription("Управление наказаниями")
        .addSubcommand(subcommand =>
            subcommand
                .setName("get")
                .setDescription("Получить информацию о наказании")
                .addStringOption(option =>
                    option
                        .setName("id")
                        .setDescription("ID наказания")
                        .setRequired(true)
                )
        );

    constructor(
        @Inject("IModerationService")
        private readonly _moderationService: IModerationService,
        @Inject("IEmbedFactory")
        private readonly _embedFactory: IEmbedFactory
    ) {}

    @RequiresPermission(Permissions.MODERATION_VIEW_PUNISHMENTS)
    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === "get") {
            const punishmentId = interaction.options.getString("id", true);
            
            const punishment = await this._moderationService.getPunishment(
                interaction.guild.id,
                punishmentId
            );
            
            if (!punishment) {
                await interaction.reply({
                    content: "Наказание с указанным ID не найдено.",
                    ephemeral: true
                });
                return;
            }
            
            const embed = this._embedFactory.createInfo({
                title: `📋 Наказание #${punishment.id}`,
                fields: [
                    { name: "Тип", value: punishment.type, inline: true },
                    { name: "Пользователь", value: `<@${punishment.userId}>`, inline: true },
                    { name: "Модератор", value: `<@${punishment.moderatorId}>`, inline: true },
                    { name: "Причина", value: punishment.reason, inline: false },
                    { name: "Дата", value: punishment.timestamp.toLocaleString('ru-RU'), inline: true },
                    { name: "Статус", value: punishment.active ? "Активно" : "Неактивно", inline: true }
                ]
            });
            
            await interaction.reply({ embeds: [embed] });
        }
    }
}
```


## Шаг 6: Сборка модуля с экспортом по интерфейсу

**`moderation/moderation.module.ts`**

```typescript
import { Module } from "@nestjs/common";
import { CoreModule } from "@/core.module";
import { GuildConfigModule } from "@modules.DiscordClient/module.GuildConfigManager/config.guild-config-manager.module";
import { ModerationService } from "./services/Moderation.service";
import { KickCommand } from "./commands/Kick.command";
import { PunishmentGetCommand } from "./commands/PunishmentGet.command";

@Module({
    imports: [
        CoreModule,
        GuildConfigModule
    ],
    providers: [
        ModerationService,
        {
            provide: "IModerationService",
            useClass: ModerationService
        },
        KickCommand,
        PunishmentGetCommand
    ],
    exports: [
        "IModerationService" // Экспорт по интерфейсу
    ],
})
export class ModerationModule {}
```


## Шаг 7: Глобальная регистрация

**`src/app.module.ts`**

```typescript
import { Module } from "@nestjs/common";
// ... другие импорты
import { ModerationModule } from '@modules.DiscordClient/moderation/moderation.module';

@Module({
    imports: [
        // ...
        ModerationModule, // <-- Добавить сюда
    ],
    // ...
})
export class AppModule {}
```

После выполнения всех шагов команды `/kick` и `/punishment get` будут зарегистрированы и готовы к работе. Сервис экспортируется по интерфейсу, что позволяет другим модулям использовать его через абстракцию.

