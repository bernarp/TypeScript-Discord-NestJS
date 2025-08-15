import { Client } from "discord.js";

export class ClientReadyEvent {
    constructor(public readonly client: Client) {}
}
