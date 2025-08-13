// src/modules/module.DiscordClient/example/handlers/DeleteMessageButton.handler.ts

import { Inject, Injectable } from "@nestjs/common";
import { ButtonInteraction } from "discord.js";
import { IButtonHandler } from "@interface/IButtonHandler";
import { Button } from "@decorators/button.decorator";
import { ILogger } from "@interface/logger/ILogger";
import { CustomIds } from "@/core.DiscordClient/abstractions/enum/CustomIds";

@Injectable()
@Button() 
export class DeleteMessageButtonHandler implements IButtonHandler {
    /**
     * @inheritdoc
     */
    public readonly customId = CustomIds.DELETE_TEST_MESSAGE_BUTTON;

    constructor(@Inject("ILogger") private readonly _logger: ILogger) {}

    /**
     * @inheritdoc
     */
    public async execute(interaction: ButtonInteraction): Promise<void> {
        if (!interaction.inGuild()) {
            return;
        }

        this._logger.inf(`Delete button clicked by ${interaction.user.tag}`, {
            messageId: interaction.message.id,
        });

        try {
            await interaction.message.delete();
            await interaction.reply({
                content: "Сообщение было успешно удалено.",
                ephemeral: true,
            });
        } catch (error) {
            this._logger.err(
                `Failed to delete message ${interaction.message.id}`,
                error.stack
            );
            await interaction.reply({
                content:
                    "Не удалось удалить сообщение. Возможно, оно уже было удалено.",
                ephemeral: true,
            });
        }
    }
}
