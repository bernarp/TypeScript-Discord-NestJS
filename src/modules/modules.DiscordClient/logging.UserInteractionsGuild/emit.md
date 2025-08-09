```typescript ".../logging.UserInteractionsGuild/services/InteractionLoggerService.ts"

@OnEvent("interaction.created")
    async onInteractionCreated(payload: InteractionCreateEvent): Promise<void> {
        const { interaction } = payload;
        const { user, channel, commandName, guild, commandId, channelId } =
            interaction;

        const logContext = {
            command: {
                name: `/${commandName}`,
                id: commandId,
            },
            user: {
                tag: user.tag,
                id: user.id,
            },
            source: {
                type: interaction.inGuild() ? "Guild" : "DM",
                guild: interaction.inGuild()
                    ? { name: guild?.name, id: guild?.id }
                    : undefined,
                channel: {
                    type: ChannelType[channel?.type ?? 0],
                    id: channelId,
                },
            },
        };
        
```
