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
    const l = new Logger("Bootstrap");
    try {
        const ns = await NestFactory.create(AppModule, {
            logger: ["log", "error", "warn", "debug", "verbose"],
        });

        const emdf = ns.get<IEmbedFactory>("IEmbedFactory");
        const erlog = ns.get(ErrorLoggerService);

        ns.useGlobalFilters(new appErrorHandler(emdf, erlog));

        ns.enableShutdownHooks();
        await ns.init();
        const cl = ns.get<IClient>("IClient");
        await cl.start();
        l.log("Application successfully started.");
    } catch (error) {
        l.error(
            "A critical error occurred during application startup:",
            error
        );
        process.exit(1);
    }
}

bootstrap();
