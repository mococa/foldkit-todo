import type { Message } from './message';
import type { Model } from './model';

export const update = (model: Model, _message: Message) => ({ model });
