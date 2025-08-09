import { CoreModule } from "@/core.module";
import { Module } from "@nestjs/common";
import { InteractionLoggerCommandService } from "./services/InteractionLoggerCommandService";

@Module({
    imports: [CoreModule],
    providers: [InteractionLoggerCommandService],
    exports: [],
})
export class LoggingUserInteractionsGuildModule {}
