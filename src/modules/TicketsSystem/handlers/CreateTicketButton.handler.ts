/**
 * @file CreateTicketButton.handler.ts
 * @description Обработчик кнопки и последующего выбора для создания нового тикета.
 */

import { Inject, Injectable } from "@nestjs/common";
import {
    ActionRowBuilder,
    ButtonInteraction,
    GuildMember, 
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    StringSelectMenuOptionBuilder,
} from "discord.js";
import { Button } from "@decorators/button.decorator";
import { IButtonHandler } from "@interactions/interfaces/IButtonHandler";
import { CustomIds } from "@enums/CustomIds.enum";
import { TicketType } from "../enums/TicketType.enum";
import { OnEvent } from "@nestjs/event-emitter";
import { AppEvents } from "@events/app.events";
import { InteractionCreateEvent } from "@events/interaction-create.eventv2";
import { ITicketService } from "../interfaces/ITicketService";
import { IEmbedFactory } from "@interfaces/IEmbedFactory";

@Injectable()
@Button()
export class CreateTicketButtonHandler implements IButtonHandler {
    public readonly customId = CustomIds.CREATE_TICKET_BUTTON;

    constructor(
        @Inject("ITicketService")
        private readonly _ticketService: ITicketService,
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory
    ) {}

    // VVV ИСПРАВЛЕННЫЙ БЛОК VVV
    /**
     * @inheritdoc
     * @description Теперь этот метод не показывает модальное окно, а отправляет эфемерное сообщение с выбором типа тикета.
     */
    public async execute(interaction: ButtonInteraction): Promise<void> {
        const typeSelect = new StringSelectMenuBuilder()
            .setCustomId(CustomIds.CREATE_TICKET_TYPE_SELECT)
            .setPlaceholder("Выберите причину вашего обращения...")
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel("Техническая поддержка")
                    .setValue(TicketType.SUPPORT),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Жалоба на пользователя")
                    .setValue(TicketType.COMPLAINT),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Общий вопрос")
                    .setValue(TicketType.QUESTION),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Другое")
                    .setValue(TicketType.OTHER)
            );

        const row =
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                typeSelect
            );

        await interaction.reply({
            content:
                "Пожалуйста, укажите категорию вашего вопроса, чтобы мы могли быстрее вам помочь.",
            components: [row],
            ephemeral: true,
        });
    }

    /**
     * @method onTypeSelect
     * @description Обрабатывает взаимодействие с выпадающим меню выбора типа тикета.
     */
    @OnEvent(AppEvents.INTERACTION_CREATED)
    public async onTypeSelect(payload: InteractionCreateEvent): Promise<void> {
        const { interaction } = payload;
        if (
            !interaction.isStringSelectMenu() ||
            interaction.customId !== CustomIds.CREATE_TICKET_TYPE_SELECT
        ) {
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const ticketType = interaction.values[0] as TicketType;

        try {
            const channel = await this._ticketService.createTicket(
                interaction.member as GuildMember,
                ticketType
            );
            const successEmbed = this._embedFactory.createSuccessEmbed({
                description: `Ваш тикет был успешно создан: ${channel.toString()}`,
                context: { user: interaction.user, guild: interaction.guild },
            });
            await interaction.editReply({ embeds: [successEmbed] });
        } catch (error) {
            const errorEmbed = this._embedFactory.createErrorEmbed({
                description: error.message,
                context: { user: interaction.user, guild: interaction.guild },
            });
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
    // ^^^ ИСПРАВЛЕННЫЙ БЛОК ^^^
}

