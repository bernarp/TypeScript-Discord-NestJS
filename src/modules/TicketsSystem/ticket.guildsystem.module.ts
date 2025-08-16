/**
 * @file ticket.module.ts
 * @description Главный модуль системы тикетов.
 */

import { Module } from "@nestjs/common";
import { CoreModule } from "@core/core.module";
import { PermissionsModule } from "@permissions/permissions.module";
import { ILogger } from "@logger";
import { JsonStorageStrategy } from "@config/storage/JsonStorageStrategy";
import { IStorageStrategy } from "@config/storage/IStorageStrategy";

// Абстракции
import { IActiveTicket } from ".//interfaces/IActiveTicket";
import { ITicketSettings } from ".//interfaces/ITicketSettings";

// Репозитории
import { TicketSettingsRepository } from "./repositories/TicketSettings.repository";
import { TicketRepository } from "./repositories/Ticket.repository";

// Сервисы
import { TicketService } from "./services/Ticket.service";
import { TicketPanelService } from "./services/TicketPanel.service";
import { TicketTranscriptService } from "./services/TicketTranscript.service";

// Команды
import { TicketSettingsCommand } from "./commands/TicketSettings.command";
import { TicketCommand } from "./commands/Ticket.command";

// Обработчики
import { CreateTicketButtonHandler } from "./handlers/CreateTicketButton.handler";
import { CloseTicketButtonHandler } from "./handlers/CloseTicketButton.handler";

@Module({
    imports: [CoreModule, PermissionsModule],
    providers: [
        {
            provide: "TicketSettingsStorageStrategy",
            useFactory: (logger: ILogger) => {
                return new JsonStorageStrategy<Map<string, ITicketSettings>>(
                    "ticket-settings.json",
                    logger,
                    () => new Map()
                );
            },
            inject: ["ILogger"],
        },
        {
            provide: "ActiveTicketsStorageStrategy",
            useFactory: (logger: ILogger) => {
                return new JsonStorageStrategy<Map<string, IActiveTicket>>(
                    "active-tickets.json",
                    logger,
                    () => new Map()
                );
            },
            inject: ["ILogger"],
        },
        {
            provide: "ITicketSettingsRepository",
            useFactory: async (
                storage: IStorageStrategy<Map<string, ITicketSettings>>,
                logger: ILogger
            ) => {
                const repo = new TicketSettingsRepository(storage, logger);
                await repo.init();
                return repo;
            },
            inject: ["TicketSettingsStorageStrategy", "ILogger"],
        },
        {
            provide: "ITicketRepository",
            useFactory: async (
                storage: IStorageStrategy<Map<string, IActiveTicket>>,
                logger: ILogger
            ) => {
                const repo = new TicketRepository(storage, logger);
                await repo.init();
                return repo;
            },
            inject: ["ActiveTicketsStorageStrategy", "ILogger"],
        },
        {
            provide: "ITicketService",
            useClass: TicketService,
        },
        TicketPanelService,
        TicketSettingsCommand,
        TicketCommand,
        CreateTicketButtonHandler,
        CloseTicketButtonHandler,
        TicketTranscriptService
    ],
    exports: ["ITicketService"],
})
export class TicketModule {}
