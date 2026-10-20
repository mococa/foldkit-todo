import { Effect, Schema } from 'effect';
import { Command } from 'foldkit';

import { Todo, parseTodos, serializeTodos } from '../../../domain/todo';
import { Message } from './message';

export const todosKey = (userId: string) => `foldkit-todo:${userId}`;

export const CreateTodo = Command.define('CreateTodo', {
  args: { title: Schema.String },
  messages: [Message.CreatedTodo],
  execute: ({ title }) =>
    Effect.sync(() =>
      Message.CreatedTodo({ id: globalThis.crypto.randomUUID(), title }),
    ),
});

export const LoadTodos = Command.define('LoadTodos', {
  args: { userId: Schema.String },
  messages: [Message.LoadedTodos],
  execute: ({ userId }) =>
    Effect.sync(() => {
      const raw = globalThis.localStorage.getItem(todosKey(userId));

      if (raw === null) {
        return Message.LoadedTodos({ todos: [] });
      }

      try {
        return Message.LoadedTodos({ todos: parseTodos(raw) });
      } catch {
        return Message.LoadedTodos({ todos: [] });
      }
    }),
});

export const PersistTodos = Command.define('PersistTodos', {
  args: { userId: Schema.String, todos: Schema.Array(Todo) },
  messages: [Message.CompletedPersistTodos],
  execute: ({ userId, todos }) =>
    Effect.sync(() => {
      globalThis.localStorage.setItem(todosKey(userId), serializeTodos(todos));
      return Message.CompletedPersistTodos();
    }),
});
