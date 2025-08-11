---

# Руководство: Создание нового модуля

Этот гайд описывает процесс создания нового функционального модуля на примере команды `/kick`.

### Шаг 1: Создание структуры файлов

Создайте следующую структуру в `src/modules/modules.DiscordClient/`:

```
moderation/
├── commands/
│   └── Kick.command.ts
├── services/
│   └── Moderation.service.ts
└── moderation.module.ts
```

### Шаг 2: Определение права доступа

Добавьте новое право в глобальный словарь `permissions.dictionary.ts`. Это централизует управление доступом к команде.

```typescript
// src/core.DiscordClient/domain/permissions.DiscordClient/permissions.dictionary.ts
export const Permissions = {
    // ...
    MODERATION_KICK: "moderation.kick",
    // ...
} as const;
```

### Шаг 3: Создание сервиса (Бизнес-логика)

Сервис инкапсулирует основную логику, не зависящую от Discord, и может использовать другие глобальные сервисы.

> **`moderation/services/Moderation.service.ts`**
> ```typescript
> import { Inject, Injectable, Logger } from "@nestjs/common";
> import { GuildMember } from "discord.js";
> import { IGuildConfig } from "@interface/IGuildConfig";
> 
> @Injectable()
> export class ModerationService {
>     private readonly _logger = new Logger(ModerationService.name);
> 
>     constructor(
>         @Inject("IGuildConfig")
>         private readonly _guildConfig: IGuildConfig
>     ) {}
> 
>     public async kickMember(member: GuildMember, reason: string): Promise<void> {
>         if (!member.kickable) {
>             throw new Error("Недостаточно прав для кика этого участника.");
>         }
>         await member.kick(reason);
> 
>         this._logger.log(`Kicked ${member.user.tag} for: ${reason}`);
>         const logChannelId = await this._guildConfig.get<string>(
>             member.guild.id,
>             "logChannelId"
>         );
>         // ...дальнейшая логика отправки лога
>     }
> }
> ```

### Шаг 4: Создание команды (Точка входа)

Команда обрабатывает взаимодействие с Discord, проверяет права через декоратор и вызывает сервис.

> **`moderation/commands/Kick.command.ts`**
> ```typescript
> import { Inject, Injectable } from "@nestjs/common";
> import { SlashCommandBuilder, CommandInteraction } from "discord.js";
> import { Command } from "@decorators/command.decorator";
> import { ICommand } from "@interface/ICommand";
> import { RequiresPermission } from "@decorators/RequiresPermission.decorator";
> import { Permissions } from "@permissions/permissions.dictionary";
> import { ModerationService } from "../services/Moderation.service";
> import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
> 
> @Command()
> @Injectable()
> export class KickCommand implements ICommand {
>     public readonly data = new SlashCommandBuilder()
>         .setName("kick")
>         .setDescription("Выгоняет участника с сервера.")
>         .addUserOption(/* ... */);
> 
>     constructor(
>         private readonly _moderationService: ModerationService,
>         @Inject("IEmbedFactory")
>         private readonly _embedFactory: IEmbedFactory
>     ) {}
> 
>     @RequiresPermission(Permissions.MODERATION_KICK)
>     public async execute(interaction: CommandInteraction): Promise<void> {
>         // 1. Получить опции из interaction
>         // 2. Вызвать this._moderationService.kickMember(...)
>         // 3. Ответить пользователю с помощью this._embedFactory
>     }
> }
> ```

### Шаг 5: Сборка модуля

Объедините все компоненты в файле модуля, импортировав необходимые зависимости.

> **`moderation/moderation.module.ts`**
> ```typescript
> import { Module } from "@nestjs/common";
> import { CoreModule } from "@/core.module";
> import { GuildConfigModule } from "@modules.DiscordClient/module.GuildConfigManager/config.guild-config-manager.module";
> import { ModerationService } from "./services/Moderation.service";
> import { KickCommand } from "./commands/Kick.command";
> 
> @Module({
>     imports: [
>         CoreModule, // Обеспечивает доступ к IEmbedFactory, IGuildConfig и т.д.
>         GuildConfigModule // Обеспечивает доступ к IPermissionService (через Guard)
>     ],
>     providers: [ModerationService, KickCommand],
> })
> export class ModerationModule {}
> ```

### Шаг 6: Глобальная регистрация

Зарегистрируйте новый модуль в `app.module.ts`, чтобы приложение знало о его существовании.

> **`src/app.module.ts`**
> ```typescript
> import { Module } from "@nestjs/common";
> // ... другие импорты
> import { ModerationModule } from '@modules.DiscordClient/moderation/moderation.module';
> 
> @Module({
>     imports: [
>         // ...
>         ModerationModule, // <-- Добавить сюда
>     ],
>     // ...
> })
> export class AppModule {}
> ```

После этих шагов команда `/kick` будет зарегистрирована и готова к работе.
