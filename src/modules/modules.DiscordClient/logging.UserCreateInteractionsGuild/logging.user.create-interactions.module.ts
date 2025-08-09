import { CoreModule } from "@/core.module";
import { Module } from "@nestjs/common";
import { InteractionLoggerService } from "./services/InteractionLoggerService";

@Module({
    imports: [CoreModule],
    providers: [InteractionLoggerService],
    exports: [],
})
export class LoggingUserCreateInteractionsGuildModule {}
