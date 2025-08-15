import { CoreModule } from "@/core.module";
import { Module } from "@nestjs/common";
import { TicketPanelService } from "./services/TicketPanel.service";

@Module({
    imports: [CoreModule],
    providers: [TicketPanelService],
})
export class TicketGuildsystemModule {}
