import { CoreModule } from "@/core.module";
import { Module } from "@nestjs/common";

@Module({
    imports: [CoreModule],
    providers: [],
})
export class TicketGuildsystemModule {}
