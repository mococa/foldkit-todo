import { Schema } from 'effect';
import { defineMessageUnion } from 'foldkit/message';

import { Todo } from '../../../domain/todo';

export const Message = defineMessageUnion({
  ChangedTodoDraft: { value: Schema.String },
  SubmittedTodo: {},
  CreatedTodo: { id: Schema.String, title: Schema.String },
  ToggledTodo: { id: Schema.String },
  DeletedTodo: { id: Schema.String },
  LoadedTodos: { todos: Schema.Array(Todo) },
  CompletedPersistTodos: {},
  ClickedLogout: {},
});

export type Message = typeof Message.Type;

export const OutMessage = defineMessageUnion({
  ClickedLogout: {},
});

export type OutMessage = typeof OutMessage.Type;
