import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { IClient } from "@interface/IClient";
import { IEmbedFactory } from "@interface/utils/IEmbedFactory";
import { ErrorLoggerService } from "@err/services/ErrorLoggerService";
import { appErrorHandler } from "@err/appErrorHandler";
import { CustomLoggerService } from "@core/LoggerClient";

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
    }
}
start();
