Понял. Максимально кратко, по делу, с акцентом на ключевые шаги и правильным форматированием Markdown.

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

Добавьте новое право в глобальный словарь `permissions.dictionary.ts`. Это позволит централизованно управлять доступом к команде.

```typescript
// src/core.DiscordClient/domain/permissions.DiscordClient/permissions.dictionary.ts
export const Permissions = {
    // ...
    MODERATION_KICK: "moderation.kick",
    // ...
} as const;
```

### Шаг 3: Создание сервиса (Бизнес-логика)

Сервис инкапсулирует основную логику, не зависящую от Discord.

> **`moderation/services/Moderation.service.ts`**
> ```typescript
> @Injectable()
> export class ModerationService {
>     public async kickMember(member: GuildMember, reason: string): Promise<void> {
>         if (!member.kickable) {
>             throw new Error("Недостаточно прав для кика этого участника.");
>         }
>         await member.kick(reason);
>         // ...логика для аудита
>     }
> }
> ```

### Шаг 4: Создание команды (Точка входа)

Команда обрабатывает взаимодействие с Discord, проверяет права и вызывает сервис.

> **`moderation/commands/Kick.command.ts`**
> ```typescript
> @Command()
> @Injectable()
> export class KickCommand implements ICommand {
>     public readonly data = new SlashCommandBuilder()
>         .setName("kick")
>         .setDescription("Выгоняет участника с сервера.")
>         .addUserOption(/* ... */);
> 
>     constructor(private readonly _moderationService: ModerationService) {}
> 
>     @RequiresPermission(Permissions.MODERATION_KICK)
>     public async execute(interaction: CommandInteraction): Promise<void> {
>         // 1. Получить опции из interaction
>         // 2. Вызвать this._moderationService.kickMember(...)
>         // 3. Ответить пользователю
>     }
> }
> ```

### Шаг 5: Сборка модуля

Объедините все компоненты в файле модуля.

> **`moderation/moderation.module.ts`**
> ```typescript
> @Module({
>     imports: [CoreModule, GuildConfigModule], // GuildConfigModule нужен для работы @RequiresPermission
>     providers: [ModerationService, KickCommand],
> })
> export class ModerationModule {}
> ```

### Шаг 6: Глобальная регистрация

Зарегистрируйте новый модуль в `app.module.ts`, чтобы приложение знало о его существовании.

> **`src/app.module.ts`**
> ```typescript
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
