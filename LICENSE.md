---

# Руководство: Создание нового модуля

Этот гайд описывает процесс создания нового функционального модуля на примере команд модерации (`/kick`, `/punishment`).

## Шаг 1: Создание структуры файлов

Создайте следующую структуру в `src/modules/`:

```
moderation/
├── commands/
│   ├── Kick.command.ts
│   └── Punishment.command.ts
├── services/
│   └── Moderation.service.ts
├── interfaces/
│   └── IModerationService.ts
└── moderation.module.ts
```

## Шаг 2: Определение прав доступа

Добавьте новые права в глобальный словарь `permissions.dictionary.ts`:

**`src/core.DiscordClient/abstractions/enums/permissions.dictionary.ts`**
```typescript
export const Permissions = {
    // ...
    // --- Модерация участников ---
    MODERATION_KICK: "moderation.kick",
    MODERATION_VIEW_PUNISHMENTS: "moderation.view_punishments",
    // ...
} as const;
```

## Шаг 3: Создание интерфейса сервиса

Интерфейс определяет публичный контракт сервиса, который будет доступен другим модулям.

**`moderation/interfaces/IModerationService.ts`**
```typescript
import { Guild, GuildMember, User } from "discord.js";

// Типы данных, специфичные для этого модуля
export interface PunishmentRecord {
    id: string;
    guildId: string;
    userId: string;
    moderatorId: string;
    type: 'kick' | 'ban' | 'warn' | 'mute';
    reason: string;
    timestamp: Date;
}

export interface IModerationService {
    /**
     * Выгоняет участника с сервера и создает запись о наказании.
     * @param member Участник, которого нужно кикнуть.
     * @param moderator Модератор, выполняющий действие.
     * @param reason Причина кика.
     * @returns {Promise<PunishmentRecord>} Созданная запись о наказании.
     */
    kickMember(member: GuildMember, moderator: User, reason: string): Promise<PunishmentRecord>;

    /**
     * Получает запись о наказании по его ID.
     * @param guild Гильдия, в которой было выдано наказание.
     * @param punishmentId ID наказания.
     * @returns {Promise<PunishmentRecord | null>}
     */
    getPunishment(guild: Guild, punishmentId: string): Promise<PunishmentRecord | null>;
}
```

## Шаг 4: Создание сервиса (Бизнес-логика)

Сервис реализует интерфейс и содержит всю основную логику. Он зависит от абстракций, а не от конкретных классов.

**`moderation/services/Moderation.service.ts`**
```typescript
import { Inject, Injectable } from "@nestjs/common";
import { Guild, GuildMember, User } from "discord.js";
import { Service } from "@core/abstractions/Service";
import { IModerationService, PunishmentRecord } from "../interfaces/IModerationService";
import { IConfigurationService } from "@interface/config/IConfigurationService";
import { ILogger } from "@interface/logger/ILogger";

@Injectable()
export class ModerationService extends Service implements IModerationService {
    constructor(
        @Inject("IConfigurationService")
        private readonly _configService: IConfigurationService,
        @Inject("ILogger")
        private readonly _logger: ILogger
    ) {
        super();
    }

    public async kickMember(member: GuildMember, moderator: User, reason: string): Promise<PunishmentRecord> {
        if (!member.kickable) {
            this._logger.warn(`Attempted to kick a non-kickable member ${member.user.tag} by ${moderator.tag}.`);
            throw new Error("У меня недостаточно прав, чтобы выгнать этого участника.");
        }

        await member.kick(reason);
        this._logger.inf(`Kicked ${member.user.tag} from ${member.guild.name} by ${moderator.tag}. Reason: ${reason}`);

        // Здесь будет логика сохранения наказания в базу данных.
        // Сейчас мы просто возвращаем заглушку.
        const punishment: PunishmentRecord = {
            id: Math.random().toString(36).substring(2, 8),
            guildId: member.guild.id,
            userId: member.id,
            moderatorId: moderator.id,
            type: 'kick',
            reason,
            timestamp: new Date(),
        };

        // Логика отправки сообщения в канал логов (если он настроен)
        const settings = await this._configService.guilds.getGuildSettings(member.guild.id);
        const logChannelId = settings?.logChannelId;
        // ...дальнейшая логика отправки лога...

        return punishment;
    }

    public async getPunishment(guild: Guild, punishmentId: string): Promise<PunishmentRecord | null> {
        // Здесь должна быть логика получения наказания из базы данных
        this._logger.debug(`Fetching punishment ${punishmentId} for guild ${guild.id}`);
        return {
            id: punishmentId,
            guildId: guild.id,
            userId: "123456789012345678", // Placeholder
            moderatorId: "987654321098765432", // Placeholder
            type: 'kick',
            reason: "Нарушение правил (пример из заглушки)",
            timestamp: new Date(),
        };
    }
}
```

## Шаг 5: Создание команд

Команды — это точка входа для пользователя. Они должны быть "тонкими", то есть содержать минимум логики, делегируя основную работу сервисам.

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
        .setDMPermission(false)
        .addUserOption(option =>
            option.setName("участник").setDescription("Участник, которого нужно выгнать").setRequired(true)
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
        const target = interaction.options.getMember("участник") as GuildMember;
        const reason = interaction.options.getString("причина") ?? "Причина не указана";

        if (!target) {
            await interaction.reply({ content: "Указанный участник не найден на сервере.", ephemeral: true });
            return;
        }

        try {
            const punishment = await this._moderationService.kickMember(target, interaction.user, reason);
            const successEmbed = this._embedFactory.createSuccessEmbed({
                description: `Участник ${target.user.tag} был успешно выгнан.`,
                fields: [
                    { name: "Модератор", value: interaction.user.toString(), inline: true },
                    { name: "Причина", value: reason, inline: true },
                    { name: "ID Наказания", value: `\`${punishment.id}\``, inline: true },
                ],
                context: { user: interaction.user, guild: interaction.guild }
            });
            await interaction.reply({ embeds: [successEmbed] });
        } catch (error) {
            const errorEmbed = this._embedFactory.createErrorEmbed({
                description: error.message,
                context: { user: interaction.user, guild: interaction.guild }
            });
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}
```

**`moderation/commands/Punishment.command.ts`**
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
export class PunishmentCommand implements ICommand {
    public readonly data = new SlashCommandBuilder()
        .setName("punishment")
        .setDescription("Управление наказаниями")
        .setDMPermission(false)
        .addSubcommand(subcommand =>
            subcommand
                .setName("get")
                .setDescription("Получить информацию о наказании по его ID")
                .addStringOption(option =>
                    option.setName("id").setDescription("ID наказания").setRequired(true)
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
            const punishment = await this._moderationService.getPunishment(interaction.guild, punishmentId);
            
            if (!punishment) {
                await interaction.reply({ content: "Наказание с указанным ID не найдено.", ephemeral: true });
                return;
            }
            
            const embed = this._embedFactory.createInfoEmbed({
                title: `📋 Наказание #${punishment.id}`,
                fields: [
                    { name: "Тип", value: punishment.type, inline: true },
                    { name: "Пользователь", value: `<@${punishment.userId}>`, inline: true },
                    { name: "Модератор", value: `<@${punishment.moderatorId}>`, inline: true },
                    { name: "Причина", value: punishment.reason, inline: false },
                    { name: "Дата", value: punishment.timestamp.toLocaleString('ru-RU'), inline: true },
                ],
                context: { user: interaction.user, guild: interaction.guild }
            });
            
            await interaction.reply({ embeds: [embed] });
        }
    }
}
```

## Шаг 6: Сборка модуля с экспортом по интерфейсу

Модуль регистрирует все свои компоненты и экспортирует сервис по интерфейсу, чтобы другие модули могли его использовать, не зная о конкретной реализации.

**`moderation/moderation.module.ts`**
```typescript
import { Module } from "@nestjs/common";
import { CoreModule } from "@/core.module";
import { ModerationService } from "./services/Moderation.service";
import { KickCommand } from "./commands/Kick.command";
import { PunishmentCommand } from "./commands/Punishment.command";

@Module({
    imports: [CoreModule],
    providers: [
        // Регистрируем сервис и связываем его с интерфейсом
        {
            provide: "IModerationService",
            useClass: ModerationService
        },
        // Регистрируем команды, чтобы DiscoveryService мог их найти
        KickCommand,
        PunishmentCommand
    ],
    exports: [
        "IModerationService" // Экспортируем сервис по интерфейсу
    ],
})
export class ModerationModule {}
```

## Шаг 7: Глобальная регистрация модуля

Добавьте новый модуль в главный модуль приложения.

**`src/app.module.ts`**
```typescript
import { Module, DynamicModule } from "@nestjs/common";
import { CoreModule } from "@/core.module";
import { ExampleModule } from "@modules.DiscordClient/example/example.module";
import { HandlersModule as registerModule } from "./handlers.Global/handlers.module";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { LoggingUserInteractionsGuildModule } from "@modules.DiscordClient/logging.UserInteractionsGuild/logging.user-interactions.module";
import { TicketGuildsystemModule } from "@modules.DiscordClient/ticket.GuildSystem/ticket.guildsystem.module";
import { PermissionGuard } from "./guards.NestJS/PermissionGuard";
import { APP_GUARD } from "@nestjs/core";
import { GuildConfigModule } from "./modules/module.GuildConfigManager/config.guild-config-manager.module";
import { ILogger } from "@interface/logger/ILogger";
import { ModerationModule } from './modules/moderation/moderation.module';

@Module({})
export class AppModule {
    static register(logger: ILogger): DynamicModule {
        return {
            module: AppModule,
            imports: [
                EventEmitterModule.forRoot(),
                CoreModule.forRootAsync(logger),
                GuildConfigModule,
                ExampleModule,
                LoggingUserInteractionsGuildModule,
                TicketGuildsystemModule,
                ModerationModule, // <-- Добавить сюда
                registerModule.register({
                    imports: [ExampleModule, GuildConfigModule, ModerationModule],
                }),
            ],
            providers: [
                {
                    provide: APP_GUARD,
                    useClass: PermissionGuard,
                },
                {
                    provide: "ILogger",
                    useValue: logger,
                },
            ],
        };
    }
}
```

После выполнения всех шагов команды `/kick` и `/punishment get` будут зарегистрированы и готовы к работе. Сервис `ModerationService` инкапсулирует всю логику и может быть легко использован в других частях приложения через интерфейс `IModerationService`.
