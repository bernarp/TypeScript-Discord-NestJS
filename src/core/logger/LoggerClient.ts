/**
 * @file CustomLoggerService.ts
 * @version 1.5.1: 
 * @author System
 */

import { Injectable, LoggerService } from "@nestjs/common";
import { ILogger } from "@logger";
import {
    ILogEntry,
    LogLevel,
    ILoggerConfig,
} from "@core/logger/ILogEntry";
import * as fs from "fs/promises";
import * as path from "path";

const stackTrace = require("stack-trace");

@Injectable()
export class CustomLoggerService implements ILogger, LoggerService {
    private readonly _config: Required<ILoggerConfig>;
    private readonly _sessionDirectory: string;
    private readonly _generalLogPath: string;
    private readonly _errorLogPath: string;
    private readonly _startupTime: string;
    private _isInitialized: boolean = false;
    private readonly _sourceFileName: string; 

    constructor(config?: Partial<ILoggerConfig>) {
        this._config = this._mergeConfig(config);
        this._startupTime = new Date().toISOString().replace(/[:.]/g, "-");
        this._sessionDirectory = path.join(
            this._config.baseLogDirectory,
            this._startupTime
        );
        this._generalLogPath = path.join(
            this._sessionDirectory,
            this._config.generalLogFileName
        );
        this._errorLogPath = path.join(
            this._sessionDirectory,
            this._config.errorLogFileName
        );

        // Получаем имя текущего файла один раз
        this._sourceFileName = path.basename(__filename);

        this._initializeDirectories().catch((error) => {
            console.error("Failed to initialize log directories:", error);
        });
    }

    public inf(message: string, context?: Record<string, any>): void {
        this._log("INFO", message, undefined, context);
    }

    public debug(message: string, context?: Record<string, any>): void {
        this._log("DEBUG", message, undefined, context);
    }

    public warn(message: string, context?: Record<string, any>): void {
        this._log("WARN", message, undefined, context);
    }

    public err(
        message: string,
        stack?: string,
        context?: Record<string, any>
    ): void {
        const errStack = stack || (context as any)?.stack;
        this._log("ERROR", message, errStack, context);
    }

    public fatal(
        message: string,
        stack?: string,
        context?: Record<string, any>
    ): void {
        this._log("FATAL", message, stack, context);
        setTimeout(() => {
            console.error(`FATAL ERROR: ${message}`);
            process.exit(1);
        }, 100);
    }

    public log(message: string, context?: string): void {
        const contextObj = context ? { nestContext: context } : undefined;
        this.inf(message, contextObj);
    }

    public error(message: string, stack?: string, context?: string): void {
        const contextObj = context ? { nestContext: context } : undefined;
        this.err(message, stack, contextObj);
    }

    public verbose(message: string, context?: string): void {
        const contextObj = context ? { nestContext: context } : undefined;
        this.debug(message, contextObj);
    }

    private _log(
        level: LogLevel,
        message: string,
        stack?: string,
        context?: Record<string, any>
    ): void {
        try {
            const callSite = this._getCallSite();
            const logEntry: ILogEntry = {
                timestamp: new Date().toISOString(),
                level,
                message,
                filePath: callSite?.filePath,
                lineNumber: callSite?.lineNumber,
                methodName: callSite?.methodName,
                stack: stack,
                context: context,
            };

            this._logToConsole(logEntry);

            const logLine = JSON.stringify(logEntry) + "\n";
            const targetFile = this._shouldLogToErrorFile(level)
                ? this._errorLogPath
                : this._generalLogPath;

            this._writeToFile(targetFile, logLine).catch((writeError) => {
                console.error("Failed to write log to file:", writeError);
                console.log("Original log entry:", logEntry);
            });
        } catch (logError) {
            console.error("Critical error in logger:", logError);
            console.log("Failed to log:", { level, message, stack, context });
        }
    }

    private _logToConsole(logEntry: ILogEntry): void {
        const { level, message, timestamp, context, filePath, lineNumber } =
            logEntry;

        let displayContext = (context as any)?.nestContext;
        if (!displayContext && filePath) {
            const relativePath = path.relative(process.cwd(), filePath);
            displayContext = `${relativePath}:${lineNumber || "?"}`;
        }

        const color = {
            DEBUG: "\x1b[90m",
            INFO: "\x1b[32m",
            WARN: "\x1b[33m",
            ERROR: "\x1b[31m",
            FATAL: "\x1b[35m",
            RESET: "\x1b[0m",
            CONTEXT: "\x1b[36m",
        };

        const formattedMessage = `[Nest] - ${new Date(
            timestamp
        ).toLocaleString()}   ${color[level]}${level.padEnd(7)}${color.RESET} ${
            color.CONTEXT
        }[${displayContext || ""}]${color.RESET} ${message}`;

        switch (level) {
            case "DEBUG":
                console.debug(formattedMessage);
                break;
            case "WARN":
                console.warn(formattedMessage);
                break;
            case "ERROR":
            case "FATAL":
                console.error(formattedMessage);
                if (logEntry.stack) console.error(logEntry.stack);
                break;
            default:
                console.log(formattedMessage);
        }
    }

    /**
     * @private
     * @method _getCallSite
     * @description Анализирует стек вызовов для определения места, откуда был вызван логгер.
     * @returns {{ filePath?: string; lineNumber?: number; methodName?: string } | null}
     */
    private _getCallSite(): {
        filePath?: string;
        lineNumber?: number;
        methodName?: string;
    } | null {
        try {
            const trace = stackTrace.get();

            // Ищем первый вызов, который был сделан НЕ из файла самого логгера.
            for (const frame of trace) {
                const frameFileName = frame.getFileName();
                if (
                    frameFileName &&
                    path.basename(frameFileName) !== this._sourceFileName
                ) {
                    return {
                        filePath: frame.getFileName(),
                        lineNumber: frame.getLineNumber(),
                        methodName:
                            frame.getFunctionName() ||
                            frame.getMethodName() ||
                            "anonymous",
                    };
                }
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    private _shouldLogToErrorFile(level: LogLevel): boolean {
        return level === "ERROR" || level === "FATAL";
    }

    private async _writeToFile(filePath: string, data: string): Promise<void> {
        if (!this._isInitialized) {
            await this._initializeDirectories();
        }
        await fs.appendFile(filePath, data, "utf8");
    }

    private async _initializeDirectories(): Promise<void> {
        if (this._isInitialized) {
            return;
        }
        try {
            await fs.mkdir(this._sessionDirectory, { recursive: true });
            this._isInitialized = true;
        } catch (error) {
            console.error(
                `Failed to create log directory: ${this._sessionDirectory}`,
                error
            );
            throw error;
        }
    }

    private _mergeConfig(
        userConfig?: Partial<ILoggerConfig>
    ): Required<ILoggerConfig> {
        const defaultConfig: Required<ILoggerConfig> = {
            baseLogDirectory: "./logs",
            sessionDirectoryFormat: "YYYY-MM-DDTHH-mm-ssZ",
            generalLogFileName: "logs.log",
            errorLogFileName: "error.log",
        };
        return { ...defaultConfig, ...userConfig };
    }

    public getSessionDirectory(): string {
        return path.resolve(this._sessionDirectory);
    }

    public getStartupTime(): string {
        return this._startupTime;
    }

    public async flush(): Promise<void> {
        await Promise.resolve();
    }
}
