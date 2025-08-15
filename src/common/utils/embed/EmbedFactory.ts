/**
 * @file EmbedFactory.ts
 * @description Реализация универсальной фабрики для создания Discord Embeds.
 * @version 1.1: Рефакторинг для использования кастомного ILogger.
 */

import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { Colors, EmbedBuilder } from "discord.js";
import { IClient } from "@client";
import {
    CustomEmbedOptions,
    IEmbedFactory,
    EmbedStencilOptions,
} from "@interfaces/IEmbedFactory";
import { EmbedFooterGenerator } from "./embed/embedFooter";
import { ILogger } from "@logger";

@Injectable()
export class EmbedFactory implements IEmbedFactory, OnModuleInit {
    private _footerGenerator: EmbedFooterGenerator;

    public constructor(
        @Inject("IClient") private readonly _client: IClient,
        @Inject("ILogger") private readonly _logger: ILogger
    ) {}

    public onModuleInit() {
        if (this._client.isReady()) {
            this._initializeBotInfo();
        } else {
            this._client.once("ready", () => this._initializeBotInfo());
        }
    }

    public create(options: CustomEmbedOptions): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setDescription(options.description)
            .setTimestamp(new Date());

        if (this._footerGenerator) {
            const footerData = options.context?.guild
                ? this._footerGenerator.forGuild(
                      options.context.guild,
                      options.context.user
                  )
                : options.context?.user
                ? this._footerGenerator.forUser(options.context.user)
                : this._footerGenerator.forBot();
            embed.setFooter(footerData);
        }

        if (options.title) embed.setTitle(options.title);
        if (options.color) embed.setColor(options.color);
        if (options.fields) embed.addFields(options.fields);
        if (options.author) embed.setAuthor(options.author);
        if (options.thumbnail) embed.setThumbnail(options.thumbnail);
        if (options.image) embed.setImage(options.image);

        return embed;
    }

    public createSuccessEmbed(options: EmbedStencilOptions): EmbedBuilder {
        const { title, color, ...rest } = options;
        return this.create({
            title: "✅ Успех",
            ...rest,
            color: Colors.Green,
        });
    }

    public createInfoEmbed(options: EmbedStencilOptions): EmbedBuilder {
        const { title, color, ...rest } = options;
        return this.create({
            title: "ℹ️ Информация",
            ...rest,
            color: Colors.Blue,
        });
    }

    public createErrorEmbed(options: EmbedStencilOptions): EmbedBuilder {
        const { title, color, ...rest } = options;
        return this.create({
            title: "❌ Ошибка",
            ...rest,
            color: Colors.Red,
        });
    }

    private _initializeBotInfo(): void {
        if (this._client.user) {
            this._footerGenerator = new EmbedFooterGenerator(
                this._client.user.username
            );
            this._logger.inf("EmbedFactory initialized.");
        } else {
            this._logger.warn(
                "Could not initialize EmbedFactory: client.user is null."
            );
        }
    }
}
