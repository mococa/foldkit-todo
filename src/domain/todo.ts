import { Schema } from 'effect';

export const Todo = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  completed: Schema.Boolean,
});

export type Todo = typeof Todo.Type;

export const TodoListJson = Schema.fromJsonString(
  Schema.toCodecJson(Schema.Array(Todo)),
);

export const parseTodos = (raw: string): ReadonlyArray<Todo> =>
  Schema.decodeUnknownSync(TodoListJson)(raw);

export const serializeTodos = (todos: ReadonlyArray<Todo>): string =>
  Schema.encodeSync(TodoListJson)(todos);

export const addTodo = (
  todos: ReadonlyArray<Todo>,
  todo: Todo,
): ReadonlyArray<Todo> => [...todos, todo];

export const toggleTodo = (
  todos: ReadonlyArray<Todo>,
  id: string,
): ReadonlyArray<Todo> =>
  todos.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo,
  );

export const removeTodo = (
  todos: ReadonlyArray<Todo>,
  id: string,
): ReadonlyArray<Todo> => todos.filter(todo => todo.id !== id);
