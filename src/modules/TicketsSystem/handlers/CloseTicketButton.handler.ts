/**
 * @file CloseTicketButton.handler.ts
 * @description Обработчик кнопки для закрытия тикета.
 */

import { Inject, Injectable } from "@nestjs/common";
import { ButtonInteraction, GuildMember, TextChannel } from "discord.js";
import { Button } from "@decorators/button.decorator";
import { IButtonHandler } from "@interactions/interfaces/IButtonHandler";
import { CustomIds } from "@enums/CustomIds.enum";
import { ITicketService } from "../interfaces/ITicketService";
import { IEmbedFactory } from "@interfaces/IEmbedFactory";

@Injectable()
@Button()
export class CloseTicketButtonHandler implements IButtonHandler {
    public readonly customId = new RegExp(
        `^${CustomIds.TICKET_ACTION_PREFIX}close_\\d+$`
    );

    constructor(
        @Inject("ITicketService")
        private readonly _ticketService: ITicketService,
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory
    ) {}

    public async execute(interaction: ButtonInteraction): Promise<void> {
        await interaction.deferUpdate();

        try {
            await this._ticketService.closeTicket(
                interaction.channel as TextChannel,
                interaction.member as GuildMember
            );
        } catch (error) {
            const errorEmbed = this._embedFactory.createErrorEmbed({
                description: error.message,
                context: { user: interaction.user, guild: interaction.guild },
            });
            await interaction.followUp({
                embeds: [errorEmbed],
                ephemeral: true,
            });
        }
    }
}
