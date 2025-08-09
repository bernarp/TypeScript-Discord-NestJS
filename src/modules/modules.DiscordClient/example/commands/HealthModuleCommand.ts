/**
 * @file HealthModuleCommand.ts
 * @description Команда для получения информации о состоянии модуля и системы.
 * ВЕРСИЯ 3.0: Переработана для использования кастомного create в EmbedFactory с контекстом.
 */

import { Inject, Injectable } from "@nestjs/common";
import {
    CommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    Colors,
    EmbedField,
    User,
    Guild,
} from "discord.js";
import { Command } from "@decorators/command.decorator";
import { ICommand } from "@interface/ICommand";
import { ExampleService, HealthInfo } from "../services/ExampleService";
import {
    IEmbedFactory,
    CustomEmbedOptions,
} from "@interface/utils/IEmbedFactory";

@Command()
@Injectable()
export class HealthModuleCommand implements ICommand {
    public readonly data = new SlashCommandBuilder()
        .setName("health-module")
        .setDescription("Показывает информацию о состоянии системы и модуля");

    /**
     * @constructor
     * @param _exampleService - Сервис для получения данных о системе.
     * @param _embedFactory - Фабрика для создания стандартизированных эмбедов.
     */
    public constructor(
        private readonly _exampleService: ExampleService,
        @Inject("IEmbedFactory") private readonly _embedFactory: IEmbedFactory
    ) {}

    public async execute(interaction: CommandInteraction): Promise<void> {
        try {
            await interaction.deferReply({ ephemeral: true });

            const healthInfo = await this._exampleService.getHealthInfo();
            const systemStatus = await this._exampleService.checkSystemStatus();

            const embed = this._buildHealthEmbed(
                healthInfo,
                systemStatus,
                interaction.user
            );

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            // Также передаем контекст в эмбед ошибки
            const errorEmbed = this._embedFactory.createErrorEmbed({
                description:
                    "Не удалось получить информацию о состоянии системы.",
                context: { user: interaction.user },
            });
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }

    /**
     * @private
     * @method _buildHealthEmbed
     * @description Собирает данные и использует EmbedFactory для создания финального эмбеда с контекстом.
     * @param {HealthInfo} healthInfo - Информация о здоровье системы.
     * @param {{status: string, issues: string[]}} systemStatus - Статус системы.
     * @param {User} user - Пользователь, вызвавший команду.
     * @param {(Guild | null)} guild - Гильдия, в которой вызвана команда.
     * @returns {EmbedBuilder} Готовый эмбед.
     */
    private _buildHealthEmbed(
        healthInfo: HealthInfo,
        systemStatus: { status: string; issues: string[] },
        user: User
    ): EmbedBuilder {
        let color: number;
        let statusEmoji: string;

        switch (systemStatus.status) {
            case "healthy":
                color = Colors.Green;
                statusEmoji = "✅";
                break;
            case "warning":
                color = Colors.Yellow;
                statusEmoji = "⚠️";
                break;
            case "critical":
            case "error":
                color = Colors.Red;
                statusEmoji = "🚨";
                break;
            default:
                color = Colors.Blue;
                statusEmoji = "ℹ️";
        }

        const fields: EmbedField[] = [
            {
                name: "🖥️ Система",
                value: [
                    `**Платформа:** ${healthInfo.system.platform}`,
                    `**Node.js:** ${healthInfo.system.nodeVersion}`,
                    `**PID:** ${healthInfo.system.pid}`,
                    `**Время работы:** ${healthInfo.uptime}`,
                ].join("\n"),
                inline: true,
            },
            {
                name: "💾 Память",
                value: [
                    `**Использовано:** ${healthInfo.memory.used}`,
                    `**Всего:** ${healthInfo.memory.total}`,
                    this._getMemoryBar(healthInfo.memory.percentage),
                ].join("\n"),
                inline: true,
            },
            {
                name: "⚡ Производительность",
                value: [
                    `**CPU (user):** ${healthInfo.performance.cpuUsage.user.toFixed(
                        2
                    )}ms`,
                    `**CPU (system):** ${healthInfo.performance.cpuUsage.system.toFixed(
                        2
                    )}ms`,
                ].join("\n"),
                inline: false,
            },
        ];

        if (systemStatus.issues.length > 0) {
            fields.push({
                name: "📋 Статус компонентов",
                value: systemStatus.issues.slice(0, 5).join("\n"),
                inline: false,
            });
        }

        // Создаем объект опций для кастомного эмбеда
        const embedOptions: CustomEmbedOptions = {
            title: `${statusEmoji} Состояние системы`,
            description: `Общий статус: **${systemStatus.status.toUpperCase()}**`,
            color: color,
            fields: fields,
            context: { user }, 
        };

        return this._embedFactory.create(embedOptions);
    }

    /**
     * @private
     * @method _getMemoryBar
     * @description Создает визуальную полосу использования памяти.
     * @param {number} percentage - Процент использования памяти.
     * @returns {string} Визуальная полоса.
     */
    private _getMemoryBar(percentage: number): string {
        const barLength = 10;
        const filledLength = Math.round((percentage / 100) * barLength);
        const emptyLength = barLength - filledLength;
        const bar =
            (percentage >= 90 ? "🟥" : percentage >= 70 ? "🟨" : "🟩").repeat(
                filledLength
            ) + "⬜".repeat(emptyLength);
        return `${bar} ${percentage}%`;
    }
}
