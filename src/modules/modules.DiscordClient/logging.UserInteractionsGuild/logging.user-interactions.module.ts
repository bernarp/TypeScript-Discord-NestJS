import { CoreModule } from "@/core.module";
import { Module } from "@nestjs/common";
import { InteractionLoggerCommandUse } from "./services/InteractionLoggerCommandUse";
import { InteractionLoggerDeleteMessageUser } from "./services/InteractionLoggerDeleteMessageUser";
import { InteractionLoggerCreateMessageUser } from "./services/InteractionLoggerCreateMessageUser";
import { InteractionLoggerUpdateMessageUser } from "./services/InteractionLoggerUpdateMessageUser";

@Module({
    imports: [CoreModule],
    providers: [
        InteractionLoggerCommandUse,
        InteractionLoggerDeleteMessageUser,
        InteractionLoggerCreateMessageUser,
        InteractionLoggerUpdateMessageUser,
    ],
    exports: [],
})
export class LoggingUserInteractionsGuildModule {}
