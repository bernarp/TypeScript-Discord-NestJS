/**
 * @file main.ts
 * @description Точка входа в приложение.
 */
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import { IClient } from "@interface/IClient";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { ErrorLoggerService } from "@err/services/ErrorLoggerService";
import { appErrorHandler } from "@err/appErrorHandler";

async function bootstrap() {
    const logger = new Logger("Bootstrap");
    try {
        const app = await NestFactory.create(AppModule, {
            logger: ["log", "error", "warn", "debug", "verbose"],
        });

        const embedFactory = app.get<IEmbedFactory>("IEmbedFactory");
        const errorLogger = app.get(ErrorLoggerService);

        app.useGlobalFilters(new appErrorHandler(embedFactory, errorLogger));

        app.enableShutdownHooks();
        await app.init();
        const client = app.get<IClient>("IClient");
        await client.start();
        logger.log("Application successfully started.");
    } catch (error) {
        logger.error(
            "A critical error occurred during application startup:",
            error
        );
        process.exit(1);
    }
}

bootstrap();
