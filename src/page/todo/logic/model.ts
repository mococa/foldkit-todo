import { Option, Schema } from 'effect';

import { Todo } from '../../../domain/todo';

export const Model = Schema.Struct({
  maybeUserId: Schema.Option(Schema.String),
  todos: Schema.Array(Todo),
  todoDraft: Schema.String,
});

export type Model = typeof Model.Type;

export const init: Model = {
  maybeUserId: Option.none(),
  todos: [],
  todoDraft: '',
};
