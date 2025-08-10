/**
 * @file reaction-add.event.ts
 * @description Класс-обертка для события добавления реакции.
 */
import {
    MessageReaction,
    PartialMessageReaction,
    PartialUser,
    User,
} from "discord.js";

export class ReactionAddEvent {
    constructor(
        public readonly reaction: MessageReaction | PartialMessageReaction,
        public readonly user: User | PartialUser
    ) {}
}
