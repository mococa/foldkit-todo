import { Array, Option } from 'effect';
import { Update } from 'foldkit';
import { modifyFields } from 'foldkit/struct';

import { addTodo, removeTodo, toggleTodo } from '../../../domain/todo';
import { CreateTodo, LoadTodos, PersistTodos } from './command';
import { Message, OutMessage } from './message';
import { Model } from './model';

type UpdateReturn = Update.ReturnWithOutMessage<Model, Message, OutMessage>;

const persist = (model: Model) =>
  Option.match(model.maybeUserId, {
    onNone: () => [],
    onSome: userId => [PersistTodos({ userId, todos: model.todos })],
  });

export const setUser = (
  model: Model,
  maybeUserId: Option.Option<string>,
): Update.Return<Model, Message> => {
  if (Option.getOrNull(model.maybeUserId) === Option.getOrNull(maybeUserId)) {
    return { model };
  }

  return Option.match(maybeUserId, {
    onNone: () => ({
      model: modifyFields(model, {
        maybeUserId: () => Option.none(),
        todos: () => [],
        todoDraft: () => '',
      }),
    }),
    onSome: userId => ({
      model: modifyFields(model, {
        maybeUserId: () => Option.some(userId),
        todos: () => [],
        todoDraft: () => '',
      }),
      commands: [LoadTodos({ userId })],
    }),
  });
};

export const update = (model: Model, message: Message) =>
  Message.match<UpdateReturn>(message, {
    ChangedTodoDraft: ({ value }) => ({
      model: modifyFields(model, { todoDraft: () => value }),
    }),
    SubmittedTodo: () => {
      const title = model.todoDraft.trim();

      if (title === '') {
        return { model };
      }

      return { model, commands: [CreateTodo({ title })] };
    },
    CreatedTodo: ({ id, title }) => {
      const nextModel = modifyFields(model, {
        todos: () => addTodo(model.todos, { id, title, completed: false }),
        todoDraft: () => '',
      });
      const commands = persist(nextModel);

      return Array.isArrayEmpty(commands)
        ? { model: nextModel }
        : { model: nextModel, commands };
    },
    ToggledTodo: ({ id }) => {
      const nextModel = modifyFields(model, {
        todos: () => toggleTodo(model.todos, id),
      });
      const commands = persist(nextModel);

      return Array.isArrayEmpty(commands)
        ? { model: nextModel }
        : { model: nextModel, commands };
    },
    DeletedTodo: ({ id }) => {
      const nextModel = modifyFields(model, {
        todos: () => removeTodo(model.todos, id),
      });
      const commands = persist(nextModel);

      return Array.isArrayEmpty(commands)
        ? { model: nextModel }
        : { model: nextModel, commands };
    },
    LoadedTodos: ({ todos }) => ({
      model: modifyFields(model, { todos: () => todos }),
    }),
    CompletedPersistTodos: () => ({ model }),
    ClickedLogout: () => ({
      model,
      outMessage: OutMessage.ClickedLogout(),
    }),
  });
