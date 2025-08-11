import { CoreModule } from "@/core.module";
import { Module } from "@nestjs/common";
import { InteractionLoggerDeleteMessageUser } from "./services/InteractionLoggerDeleteMessageUser";
import { InteractionLoggerCreateMessageUser } from "./services/InteractionLoggerCreateMessageUser";
import { InteractionLoggerUpdateMessageUser } from "./services/InteractionLoggerUpdateMessageUser";
import { InteractionLoggerAll } from "./services/InteractionLoggerAll";

@Module({
    imports: [CoreModule],
    providers: [
        InteractionLoggerDeleteMessageUser,
        InteractionLoggerCreateMessageUser,
        InteractionLoggerUpdateMessageUser,
        InteractionLoggerAll,
    ],
    exports: [],
})
export class LoggingUserInteractionsGuildModule {}
