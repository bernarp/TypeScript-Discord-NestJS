/**
 * @file ExampleService.ts
 * @description Сервис модуля Example для бизнес-логики и работы с данными.
 * @version 1.1: Рефакторинг для использования кастомного ILogger.
 */

import { Injectable, Inject } from "@nestjs/common";
import { ILogger } from "@logger";

export interface HealthInfo {
    status: string;
    uptime: string;
    memory: {
        used: string;
        total: string;
        percentage: number;
    };
    system: {
        platform: string;
        nodeVersion: string;
        pid: number;
    };
    performance: {
        cpuUsage: {
            user: number;
            system: number;
        };
        loadAverage: number[];
    };
    timestamp: Date;
}

@Injectable()
export class ExampleService {

    constructor(@Inject("ILogger") private readonly _logger: ILogger) {}

    public async getHealthInfo(): Promise<HealthInfo> {
        this._logger.debug("Getting system health information");

        try {
            const uptime = process.uptime();
            const memoryUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();

            const uptimeFormatted = this._formatUptime(uptime);

            const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
            const memoryTotalMB = Math.round(
                memoryUsage.heapTotal / 1024 / 1024
            );
            const memoryPercentage = Math.round(
                (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
            );

            let loadAverage: number[] = [];
            try {
                const os = await import("os");
                loadAverage = os.loadavg();
            } catch (error) {
                this._logger.warn("Could not get system load average:", {
                    error: error.message,
                });
                loadAverage = [0, 0, 0];
            }

            const healthInfo: HealthInfo = {
                status: "healthy",
                uptime: uptimeFormatted,
                memory: {
                    used: `${memoryUsedMB} MB`,
                    total: `${memoryTotalMB} MB`,
                    percentage: memoryPercentage,
                },
                system: {
                    platform: process.platform,
                    nodeVersion: process.version,
                    pid: process.pid,
                },
                performance: {
                    cpuUsage: {
                        user: Math.round(cpuUsage.user / 1000),
                        system: Math.round(cpuUsage.system / 1000),
                    },
                    loadAverage: loadAverage,
                },
                timestamp: new Date(),
            };

            this._logger.debug(
                `Health info retrieved successfully: status=${healthInfo.status}, uptime=${healthInfo.uptime}`
            );
            return healthInfo;
        } catch (error) {
            this._logger.err("Failed to get health information:", error.stack);

            return {
                status: "degraded",
                uptime: "unknown",
                memory: {
                    used: "unknown",
                    total: "unknown",
                    percentage: 0,
                },
                system: {
                    platform: process.platform || "unknown",
                    nodeVersion: process.version || "unknown",
                    pid: process.pid || 0,
                },
                performance: {
                    cpuUsage: {
                        user: 0,
                        system: 0,
                    },
                    loadAverage: [0, 0, 0],
                },
                timestamp: new Date(),
            };
        }
    }

    public async checkSystemStatus(): Promise<{
        status: string;
        issues: string[];
    }> {
        this._logger.debug("Performing system status check");

        const issues: string[] = [];
        let status = "healthy";

        try {
            const healthInfo = await this.getHealthInfo();

            if (healthInfo.memory.percentage > 90) {
                issues.push("⚠️ Высокое использование памяти");
                status = "warning";
            } else if (healthInfo.memory.percentage > 95) {
                issues.push("🚨 Критическое использование памяти");
                status = "critical";
            }

            if (healthInfo.performance.loadAverage.length > 0) {
                const avgLoad = healthInfo.performance.loadAverage[0];
                if (avgLoad > 2.0) {
                    issues.push("⚠️ Высокая загрузка системы");
                    status = status === "healthy" ? "warning" : status;
                }
            }

            const uptimeSeconds = process.uptime();
            if (uptimeSeconds < 60) {
                issues.push("ℹ️ Приложение недавно запущено");
            }

            if (issues.length === 0) {
                issues.push("✅ Все системы работают нормально");
            }

            this._logger.debug(
                `System status check completed: status=${status}, issues=${issues.length}`
            );
            return { status, issues };
        } catch (error) {
            this._logger.err(
                "Failed to perform system status check:",
                error.stack
            );
            return {
                status: "error",
                issues: ["❌ Не удалось выполнить проверку системы"],
            };
        }
    }

    private _formatUptime(uptime: number): string {
        const days = Math.floor(uptime / (24 * 60 * 60));
        const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((uptime % (60 * 60)) / 60);
        const seconds = Math.floor(uptime % 60);

        if (days > 0) {
            return `${days}д ${hours}ч ${minutes}м ${seconds}с`;
        } else if (hours > 0) {
            return `${hours}ч ${minutes}м ${seconds}с`;
        } else if (minutes > 0) {
            return `${minutes}м ${seconds}с`;
        } else {
            return `${seconds}с`;
        }
    }
}
