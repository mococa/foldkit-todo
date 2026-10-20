import { defineMessageUnion } from 'foldkit/message';

export const Message = defineMessageUnion({});
export type Message = typeof Message.Type;
