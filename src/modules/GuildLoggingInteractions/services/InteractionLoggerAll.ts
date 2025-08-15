/**
 * @file InteractionLoggerAll.ts
 * @description Сервис логирования всех типов взаимодействий Discord.
 */

import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import {
    EmbedBuilder,
    BaseInteraction,
    InteractionType,
    ChatInputCommandInteraction,
    ButtonInteraction,
    ModalSubmitInteraction,
    AnySelectMenuInteraction,
} from "discord.js";
import { InteractionCreateEvent } from "@events/interaction-create.eventv2";
import { AppEvents } from "@events/app.events";
import { BaseInteractionLogger } from "../abstractions/classesAbstract/BaseInteractionLogger.abstract";
import { LogChannelType } from "../abstractions/LogChannelType.enum";

@Injectable()
export class InteractionLoggerAll extends BaseInteractionLogger {
    @OnEvent(AppEvents.INTERACTION_CREATED)
    public async onInteractionCreated(
        payload: InteractionCreateEvent
    ): Promise<void> {
        const { interaction } = payload;

        if (!this.isInteractionLoggable(interaction)) {
            return;
        }

        const logChannelId = await this.getLogChannelId(
            interaction.guildId!,
            LogChannelType.INTERACTION
        );

        if (!logChannelId) {
            return;
        }

        const logEmbed = this.createLogEmbed(interaction);
        await this.sendLog(logChannelId, interaction.guildId!, logEmbed);
    }

    public createLogEmbed(interaction: BaseInteraction): EmbedBuilder {
        const { user, guild } = interaction;

        const embed = this._embedFactory.createInfoEmbed({
            title: "Лог: Новое взаимодействие",
            description: `Пользователь **${user.tag}** инициировал взаимодействие.`,
            context: { user, guild },
        });

        this._addBasicFields(embed, interaction);
        this._addSpecificFields(embed, interaction);

        return embed;
    }

    private _addBasicFields(
        embed: EmbedBuilder,
        interaction: BaseInteraction
    ): void {
        const { user, guild, channel } = interaction;

        embed.addFields(
            {
                name: "👤 Пользователь",
                value: `**Tag:** ${user.tag}\n**ID:** \`${user.id}\``,
                inline: true,
            },
            {
                name: "Тип",
                value: `\`${InteractionType[interaction.type]}\``,
                inline: true,
            },
            {
                name: "📍 Место",
                value: `**Сервер:** ${
                    guild?.name
                }\n**Канал:** ${channel?.toString()}`,
                inline: false,
            }
        );
    }

    private _addSpecificFields(
        embed: EmbedBuilder,
        interaction: BaseInteraction
    ): void {
        if (interaction.isChatInputCommand()) {
            this._handleCommandInteraction(embed, interaction);
        } else if (interaction.isButton()) {
            this._handleButtonInteraction(embed, interaction);
        } else if (interaction.isModalSubmit()) {
            this._handleModalInteraction(embed, interaction);
        } else if (interaction.isAnySelectMenu()) {
            this._handleSelectMenuInteraction(embed, interaction);
        }
    }

    private _handleCommandInteraction(
        embed: EmbedBuilder,
        interaction: ChatInputCommandInteraction
    ): void {
        embed.setTitle("Лог: Выполнение команды");
        embed.setDescription(
            `Пользователь **${interaction.user.tag}** вызвал команду **/${interaction.commandName}**.`
        );
        const options = interaction.options.data
            .map((opt) => `\`${opt.name}\`: \`${opt.value}\``)
            .join("\n");
        if (options) {
            embed.addFields({
                name: "⚙️ Опции",
                value: options,
                inline: false,
            });
        }
    }

    private _handleButtonInteraction(
        embed: EmbedBuilder,
        interaction: ButtonInteraction
    ): void {
        embed.setTitle("Лог: Нажатие кнопки");
        embed.setDescription(
            `Пользователь **${interaction.user.tag}** нажал на кнопку.`
        );
        embed.addFields({
            name: "🔧 Детали кнопки",
            value: `**Custom ID:** \`${interaction.customId}\``,
            inline: false,
        });
    }

    private _handleModalInteraction(
        embed: EmbedBuilder,
        interaction: ModalSubmitInteraction
    ): void {
        embed.setTitle("Лог: Отправка модального окна");
        embed.setDescription(
            `Пользователь **${interaction.user.tag}** отправил модальное окно.`
        );
        const fields = interaction.fields.fields
            .map((field) => `**${field.customId}**: \`\`\`${field.value}\`\`\``)
            .join("\n");
        embed.addFields(
            {
                name: "🔧 Детали окна",
                value: `**Custom ID:** \`${interaction.customId}\``,
                inline: false,
            },
            {
                name: "📋 Поля",
                value: fields || "*Нет данных*",
                inline: false,
            }
        );
    }

    private _handleSelectMenuInteraction(
        embed: EmbedBuilder,
        interaction: AnySelectMenuInteraction
    ): void {
        embed.setTitle("Лог: Выбор в меню");
        embed.setDescription(
            `Пользователь **${interaction.user.tag}** сделал выбор в меню.`
        );
        embed.addFields({
            name: "🔧 Детали меню",
            value: `**Custom ID:** \`${
                interaction.customId
            }\`\n**Выбрано:** \`\`\`${interaction.values.join(", ")}\`\`\``,
            inline: false,
        });
    }
}
