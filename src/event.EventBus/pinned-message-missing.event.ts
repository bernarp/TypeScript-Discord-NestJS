// src/event.EventBus/pinned-message-missing.event.ts
import { IGuildSettings } from "@type/IGuildSettings";

export class PinnedMessageMissingEvent {
    constructor(
        public readonly guildId: string,
        public readonly messageType: keyof Required<IGuildSettings>["pinnedMessages"],
        public readonly channelId?: string
    ) {}
}
