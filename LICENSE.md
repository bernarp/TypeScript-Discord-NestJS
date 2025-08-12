
# Руководство: Создание нового модуля

Этот гайд описывает процесс создания нового функционального модуля на примере команды `/kick`.

## Шаг 1: Создание структуры файлов

Создайте следующую структуру в `src/modules/modules.DiscordClient/`:

```
moderation/
├── commands/
│   └── Kick.command.ts
├── services/
│   └── Moderation.service.ts
└── moderation.module.ts
```


## Шаг 2: Определение права доступа

Добавьте новое право в глобальный словарь `permissions.dictionary.ts`:

```typescript
// src/core.DiscordClient/domain/permissions.DiscordClient/permissions.dictionary.ts
export const Permissions = {
    // ...
    MODERATION_KICK: "moderation.kick",
    // ...
} as const;
```


## Шаг 3: Создание сервиса (Бизнес-логика)

**`moderation/services/Moderation.service.ts`**

```typescript
import { Inject, Injectable, Logger } from "@nestjs/common";
import { GuildMember } from "discord.js";
import { IGuildConfig } from "@interface/IGuildConfig";
import { Service } from "@core/abstractions/Service";

@Injectable()
export class ModerationService extends Service {
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
            "logChannelId" // <------ Можно отредактировать интерфейс IGuildConfig, добавив новое поле конкретно для этого метода лога.
        );
        // ...дальнейшая логика отправки лога
    }
}
```


## Шаг 4: Создание команды (Точка входа)

**`moderation/commands/Kick.command.ts`**

```typescript
import { Inject, Injectable } from "@nestjs/common";
import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { Command } from "@decorators/command.decorator";
import { ICommand } from "@interface/ICommand";
import { RequiresPermission } from "@decorators/RequiresPermission.decorator";
import { Permissions } from "@permissions/permissions.dictionary";
import { ModerationService } from "../services/Moderation.service";
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
        private readonly _moderationService: ModerationService,
        @Inject("IEmbedFactory")
        private readonly _embedFactory: IEmbedFactory
    ) {}

    @RequiresPermission(Permissions.MODERATION_KICK)
    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const targetUser = interaction.options.getUser("участник", true);
        const reason = interaction.options.getString("причина") ?? "Причина не указана";
        
        const targetMember = await interaction.guild.members.fetch(targetUser.id);
        
        await this._moderationService.kickMember(targetMember, reason);
        
        await interaction.reply("Участник успешно выгнан!");
    }
}
```


## Шаг 5: Сборка модуля

**`moderation/moderation.module.ts`**

```typescript
import { Module } from "@nestjs/common";
import { CoreModule } from "@/core.module";
import { GuildConfigModule } from "@modules.DiscordClient/module.GuildConfigManager/config.guild-config-manager.module";
import { ModerationService } from "./services/Moderation.service";
import { KickCommand } from "./commands/Kick.command";

@Module({
    imports: [
        CoreModule,
        GuildConfigModule
    ],
    providers: [ModerationService, KickCommand],
    exports: [ModerationService],
})
export class ModerationModule {}
```


## Шаг 6: Глобальная регистрация

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

После выполнения всех шагов команда `/kick` будет зарегистрирована и готова к работе.







