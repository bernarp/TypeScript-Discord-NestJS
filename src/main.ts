/**
 * @file main.ts
 * @description Точка входа в приложение.
 */
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import { IClient } from "@interface/IClient";

async function bootstrap() {
    const logger = new Logger("Bootstrap");
    try {
        const app = await NestFactory.create(AppModule, {
            logger: ["log", "error", "warn", "debug", "verbose"],
        });
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
