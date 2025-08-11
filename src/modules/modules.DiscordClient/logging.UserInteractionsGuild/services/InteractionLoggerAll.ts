/**
 * @file InteractionLoggerAll.ts
 * @description Сервис логирования всех типов взаимодействий Discord.
 */

import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { EmbedBuilder, BaseInteraction, InteractionType } from "discord.js";
import { InteractionCreateEvent } from "@event.EventBus/interaction-create.event";
import { AppEvents } from "@/event.EventBus/app.events";
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
        const { user, guild, channel } = interaction;
        const description = `Пользователь **${user.tag}** инициировал взаимодействие.`;

        const embed = this._embedFactory.createInfoEmbed({
            title: "Лог: Новое взаимодействие",
            description: description,
            context: { user, guild },
        });

        const interactionData = this.buildInteractionData(interaction);
        this.addBasicFields(embed, interaction);
        this.addSpecificFields(embed, interaction, interactionData);
        this.addJsonField(embed, interactionData);

        return embed;
    }

    /**
     * @private
     * @method buildInteractionData
     * @description Строит базовый объект данных взаимодействия.
     */
    private buildInteractionData(
        interaction: BaseInteraction
    ): Record<string, any> {
        const { user, guild, channel } = interaction;

        return {
            id: interaction.id,
            type: InteractionType[interaction.type],
            user: {
                id: user.id,
                tag: user.tag,
                username: user.username,
            },
            guild: {
                id: guild?.id,
                name: guild?.name,
            },
            channel: {
                id: channel?.id,
                name: channel && "name" in channel ? channel.name : "Unknown",
                type: channel?.type,
            },
            createdTimestamp: interaction.createdTimestamp,
        };
    }

    /**
     * @private
     * @method addBasicFields
     * @description Добавляет базовые поля в embed.
     */
    private addBasicFields(
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

    /**
     * @private
     * @method addSpecificFields
     * @description Добавляет специфичные поля в зависимости от типа взаимодействия.
     */
    private addSpecificFields(
        embed: EmbedBuilder,
        interaction: BaseInteraction,
        interactionData: Record<string, any>
    ): void {
        if (interaction.isChatInputCommand()) {
            this.handleCommandInteraction(embed, interaction, interactionData);
        } else if (interaction.isButton()) {
            this.handleButtonInteraction(embed, interaction, interactionData);
        } else if (interaction.isModalSubmit()) {
            this.handleModalInteraction(embed, interaction, interactionData);
        } else if (interaction.isAnySelectMenu()) {
            this.handleSelectMenuInteraction(
                embed,
                interaction,
                interactionData
            );
        }
    }

    /**
     * @private
     * @method handleCommandInteraction
     * @description Обрабатывает взаимодействие команды.
     */
    private handleCommandInteraction(
        embed: EmbedBuilder,
        interaction: any,
        interactionData: Record<string, any>
    ): void {
        embed.setTitle("Лог: Выполнение команды");
        embed.setDescription(
            `Пользователь **${interaction.user.tag}** вызвал команду **/${interaction.commandName}**.`
        );

        interactionData.command = {
            name: interaction.commandName,
            id: interaction.commandId,
            options: interaction.options.data.map((option: any) => ({
                name: option.name,
                type: option.type,
                value: option.value,
            })),
        };
    }

    /**
     * @private
     * @method handleButtonInteraction
     * @description Обрабатывает взаимодействие кнопки.
     */
    private handleButtonInteraction(
        embed: EmbedBuilder,
        interaction: any,
        interactionData: Record<string, any>
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

        interactionData.button = {
            customId: interaction.customId,
            componentType: interaction.componentType,
        };
    }

    /**
     * @private
     * @method handleModalInteraction
     * @description Обрабатывает взаимодействие модального окна.
     */
    private handleModalInteraction(
        embed: EmbedBuilder,
        interaction: any,
        interactionData: Record<string, any>
    ): void {
        embed.setTitle("Лог: Отправка модального окна");
        embed.setDescription(
            `Пользователь **${interaction.user.tag}** отправил модальное окно.`
        );
        embed.addFields({
            name: "🔧 Детали окна",
            value: `**Custom ID:** \`${interaction.customId}\``,
            inline: false,
        });

        interactionData.modal = {
            customId: interaction.customId,
            fields: interaction.fields.fields.map((field: any) => ({
                customId: field.customId,
                value: field.value,
                type: field.type,
            })),
        };
    }

    /**
     * @private
     * @method handleSelectMenuInteraction
     * @description Обрабатывает взаимодействие select меню.
     */
    private handleSelectMenuInteraction(
        embed: EmbedBuilder,
        interaction: any,
        interactionData: Record<string, any>
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

        interactionData.selectMenu = {
            customId: interaction.customId,
            componentType: interaction.componentType,
            values: interaction.values,
        };
    }

    /**
     * @private
     * @method addJsonField
     * @description Добавляет JSON поле в embed.
     */
    private addJsonField(
        embed: EmbedBuilder,
        interactionData: Record<string, any>
    ): void {
        const jsonString = JSON.stringify(interactionData, null, 4);
        embed.addFields({
            name: "📋 JSON Данные",
            value: `\`\`\`json\n${jsonString}\`\`\``,
            inline: false,
        });
    }
}
