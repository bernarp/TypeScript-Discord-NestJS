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
        const NestJS = await NestFactory.create(AppModule, {
            logger: ["log", "error", "warn", "debug", "verbose"],
        });

        const emdf = NestJS.get<IEmbedFactory>("IEmbedFactory");
        const erlog = NestJS.get(ErrorLoggerService);

        NestJS.useGlobalFilters(new appErrorHandler(emdf, erlog));
        

        NestJS.enableShutdownHooks();
        await NestJS.init();
        const cl = NestJS.get<IClient>("IClient");
        await cl.start();
        l.log("Application successfully started.");
    } catch (error) {
        l.error("A critical error occurred during application startup:", error);
        process.exit(1);
    }
}

bootstrap();
