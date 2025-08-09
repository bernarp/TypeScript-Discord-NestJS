/**
 * @file Client.ts
 * @description Реализация основного клиента Discord. Теперь он только логинится.
 */
import { Client as BaseClient, Events, GatewayIntentBits } from "discord.js";
import { Injectable, Logger, Inject } from "@nestjs/common";
import { IClient } from "@interface/IClient";
import { IConfig } from "@interface/IConfig";

@Injectable()
export class Client extends BaseClient implements IClient {
    private readonly _logger = new Logger(Client.name);

    constructor(@Inject("IConfig") private readonly _config: IConfig) {
        super({
            intents: [GatewayIntentBits.Guilds],
        });
    }

    public async start(): Promise<void> {
        this._logger.log("Attempting to log in to Discord...");
        this.once(Events.ClientReady, () => {
            this._logger.log(
                `Bot has successfully logged in as ${this.user?.tag}`
            );
        });
        const token = this._config.get<string>("TOKEN");
        await this.login(token);
    }

    public async shutdown(): Promise<void> {
        this._logger.log("Shutting down bot...");
        await this.destroy();
    }
}
