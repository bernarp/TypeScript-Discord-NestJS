import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { IClient } from "@client";
import { IEmbedFactory } from "@interfaces/IEmbedFactory";
import { ErrorLoggerService } from "@error-handling/error-logger.service";
import { appErrorHandler } from "@error-handling/app-error.handler";
import { CustomLoggerService } from "@core/logger/LoggerClient";

async function start() {
    const appLogger = new CustomLoggerService();

    try {
        const NestJS = await NestFactory.create(AppModule.register(appLogger), {
            logger: appLogger,
        });

        appLogger.inf("Bootstrap logger initialized. Application starting...");

        const emdf = NestJS.get<IEmbedFactory>("IEmbedFactory");
        const erlog = NestJS.get(ErrorLoggerService);

        NestJS.useGlobalFilters(new appErrorHandler(emdf, erlog, appLogger));
        NestJS.enableShutdownHooks();

        await NestJS.init();
        const cl = NestJS.get<IClient>("IClient");
        await cl.start();
        appLogger.inf("Application successfully started.");
    } catch (error) {
        appLogger.fatal(
            "A critical error occurred during application startup",
            error.stack
        );
        process.exit(1); 
    }
}

start();