import { CoreModule } from "@core/core.module";
import { Module } from "@nestjs/common";
import { InteractionLoggerDeleteMessageUser } from "./services/InteractionLoggerDeleteMessageUser";
import { InteractionLoggerCreateMessageUser } from "./services/InteractionLoggerCreateMessageUser";
import { InteractionLoggerUpdateMessageUser } from "./services/InteractionLoggerUpdateMessageUser";
import { InteractionLoggerAll } from "./services/InteractionLoggerAll";
import { TicketTranscriptLogger } from "./services/TicketTranscriptLogger.service";

@Module({
    imports: [CoreModule],
    providers: [
        InteractionLoggerDeleteMessageUser,
        InteractionLoggerCreateMessageUser,
        InteractionLoggerUpdateMessageUser,
        InteractionLoggerAll,
        TicketTranscriptLogger,
    ],
    exports: [],
})
export class LoggingUserInteractionsGuildModule {}
