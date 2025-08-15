/**
 * @file LogChannelType.enum.ts
 * @description Enum для типов каналов логирования, обеспечивающий типобезопасность.
 */

export enum LogChannelType {
    INTERACTION = "logChannelInteractionId",
    MESSAGE_CREATE = "logChannelMessageSendId",
    MESSAGE_DELETE = "logChannelMessageDeleteId",
    MESSAGE_UPDATE = "logChannelMessageEditId",
}
