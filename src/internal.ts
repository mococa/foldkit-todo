import { Array, Effect, Option, Schema } from 'effect';
import { Command, type Update } from 'foldkit';
import { UrlRequest, load, pushUrl } from 'foldkit/navigation';
import { modifyFields } from 'foldkit/struct';
import { toString as urlToString } from 'foldkit/url';

import { basebox, sessionStore } from './basebox';
import type { Session } from './domain/session';
import { Todo, parseTodos, serializeTodos } from './domain/todo';
import { type FrameworkHeadTag, FrameworkMetadata } from './lib/router';
import type { Model } from './main';
import { AppRoute, headTags, href, pageMetadata, urlToAppRoute } from './route';

// MESSAGE

export { Message } from './message';

import { Message } from './message';

// COMMAND

const NavigateInternal = Command.define('NavigateInternal', {
  args: { url: Schema.String },
  messages: [Message.CompletedNavigateInternal],
  execute: ({ url }) =>
    pushUrl(url).pipe(Effect.as(Message.CompletedNavigateInternal())),
});

/** Navigates to a typed route value, building the URL from the router. */
export const NavigateTo = Command.define('NavigateTo', {
  args: { route: AppRoute },
  messages: [Message.CompletedNavigateInternal],
  execute: ({ route }) =>
    pushUrl(href(route)).pipe(Effect.as(Message.CompletedNavigateInternal())),
});

const LoadExternal = Command.define('LoadExternal', {
  args: { href: Schema.String },
  messages: [Message.CompletedLoadExternal],
  execute: ({ href }) =>
    load(href).pipe(Effect.as(Message.CompletedLoadExternal())),
});

export const CheckSession = Command.define('CheckSession', {
  messages: [Message.LoadedSession],
  execute: Effect.tryPromise({
    try: async (): Promise<Session | undefined> => {
      if (basebox === undefined) {
        return undefined;
      }

      const sessionId = await sessionStore.get();

      if (sessionId === null) {
        return undefined;
      }

      const client = basebox.client({ sessionId });
      const { error } = await client.auth.check();

      if (error) {
        await client.auth.logout();
        return undefined;
      }

      const { data } = await client.user.profile();

      if (
        data === undefined ||
        data.user === undefined ||
        data.profile === undefined
      ) {
        return undefined;
      }

      return {
        sessionId,
        userId: data.profile.userId,
        email: data.user.email,
        name: Option.fromNullishOr(data.profile.name),
      };
    },
    catch: () => undefined,
  }).pipe(
    Effect.catch(() => Effect.succeed(undefined)),
    Effect.map(maybeSession =>
      Message.LoadedSession({
        maybeSession: Option.fromNullishOr(maybeSession),
      }),
    ),
  ),
});

export const Logout = Command.define('Logout', {
  messages: [Message.CompletedLogout],
  execute: Effect.tryPromise({
    try: async (): Promise<Option.Option<string>> => {
      if (basebox === undefined) {
        await sessionStore.clear();
        return Option.some('Basebox is not configured.');
      }

      try {
        const client = basebox.client();
        await client.auth.logout();
        return Option.none();
      } catch (error) {
        await sessionStore.clear();
        return Option.some(
          error instanceof Error ? error.message : 'Logout failed',
        );
      }
    },
    catch: () => undefined,
  }).pipe(
    Effect.catch(() => Effect.succeed(Option.some('Logout failed'))),
    Effect.map(maybeError => Message.CompletedLogout({ maybeError })),
  ),
});

const todosKey = (userId: string) => `foldkit-todo:${userId}`;

const CreateTodo = Command.define('CreateTodo', {
  args: { title: Schema.String },
  messages: [Message.CreatedTodo],
  execute: ({ title }) =>
    Effect.sync(() =>
      Message.CreatedTodo({ id: globalThis.crypto.randomUUID(), title }),
    ),
});

const LoadTodos = Command.define('LoadTodos', {
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

const PersistTodos = Command.define('PersistTodos', {
  args: { userId: Schema.String, todos: Schema.Array(Todo) },
  messages: [Message.CompletedPersistTodos],
  execute: ({ userId, todos }) =>
    Effect.sync(() => {
      globalThis.localStorage.setItem(todosKey(userId), serializeTodos(todos));
      return Message.CompletedPersistTodos();
    }),
});

const syncHeadTag = (tag: FrameworkHeadTag): void => {
  const { document } = globalThis;
  const selector = `meta[${tag.attribute}="${tag.key}"]`;
  const existing = document.head.querySelector(selector);

  if (tag.content === undefined) {
    existing?.remove();
    return;
  }

  if (existing === null) {
    const meta = document.createElement('meta');
    meta.setAttribute(tag.attribute, tag.key);
    meta.setAttribute('content', tag.content);
    document.head.appendChild(meta);
    return;
  }

  existing.setAttribute('content', tag.content);
};

const documentHeadTags = (metadata: FrameworkMetadata) =>
  headTags({ ...metadata, ogUrl: undefined });

const SyncDocumentMetadata = Command.define('SyncDocumentMetadata', {
  args: { previous: FrameworkMetadata, next: FrameworkMetadata },
  messages: [Message.CompletedSyncDocumentMetadata],
  execute: ({ previous, next }) => {
    const nextTags = documentHeadTags(next);
    const nextKeys = new Set(
      nextTags.map(tag => `${tag.attribute}:${tag.key}`),
    );

    return Effect.forEach(
      documentHeadTags(previous),
      tag =>
        Effect.sync(() => {
          if (!nextKeys.has(`${tag.attribute}:${tag.key}`)) {
            syncHeadTag({ ...tag, content: undefined });
          }
        }),
      { discard: true },
    ).pipe(
      Effect.andThen(
        Effect.forEach(
          nextTags,
          tag =>
            Effect.sync(() => {
              syncHeadTag(tag);
            }),
          { discard: true },
        ),
      ),
      Effect.as(Message.CompletedSyncDocumentMetadata()),
    );
  },
});

// UPDATE

const persistTodos = (model: Model) =>
  Option.match(model.maybeSession, {
    onNone: () => [],
    onSome: session => [
      PersistTodos({ userId: session.userId, todos: model.todos }),
    ],
  });

const authRedirect = (model: Model) => {
  if (model.route._tag === 'Todo' && Option.isNone(model.maybeSession)) {
    return [NavigateTo({ route: AppRoute.Login() })];
  }

  if (model.route._tag === 'Login' && Option.isSome(model.maybeSession)) {
    return [NavigateTo({ route: AppRoute.Todo() })];
  }

  return [];
};

type UpdateReturn = Update.Return<Model, Message>;

export const update = (model: Model, message: Message) =>
  Message.match<UpdateReturn>(message, {
    ClickedLink: ({ request }) =>
      UrlRequest.match<UpdateReturn>(request, {
        Internal: ({ url }) => ({
          model,
          commands: [NavigateInternal({ url: urlToString(url) })],
        }),
        External: ({ href }) => ({
          model,
          commands: [LoadExternal({ href })],
        }),
      }),
    ChangedUrl: ({ url }) => {
      const nextModel = modifyFields(model, {
        route: () => urlToAppRoute(url),
      });

      return {
        model: nextModel,
        commands: [
          SyncDocumentMetadata({
            previous: pageMetadata(model.route),
            next: pageMetadata(nextModel.route),
          }),
          ...authRedirect(nextModel),
        ],
      };
    },
    CompletedNavigateInternal: () => ({ model }),
    CompletedLoadExternal: () => ({ model }),
    CompletedSyncDocumentMetadata: () => ({ model }),
    LoadedSession: ({ maybeSession }) => {
      const nextModel = modifyFields(model, {
        maybeSession: () => maybeSession,
      });
      const commands = [
        ...Option.match(maybeSession, {
          onNone: () => [],
          onSome: session => [LoadTodos({ userId: session.userId })],
        }),
        ...authRedirect(nextModel),
      ];

      return Array.isArrayEmpty(commands)
        ? { model: nextModel }
        : { model: nextModel, commands };
    },
    SucceededGoogleLogin: ({ session }) => ({
      model: modifyFields(model, {
        maybeSession: () => Option.some(session),
        maybeLoginError: () => Option.none(),
      }),
      commands: [
        LoadTodos({ userId: session.userId }),
        NavigateTo({ route: AppRoute.Todo() }),
      ],
    }),
    ClickedLogout: () => ({ model, commands: [Logout()] }),
    CompletedLogout: ({ maybeError }) => ({
      model: modifyFields(model, {
        maybeSession: () => Option.none(),
        maybeLoginError: () => maybeError,
        todos: () => [],
        todoDraft: () => '',
      }),
      commands: [NavigateTo({ route: AppRoute.Login() })],
    }),
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
        todos: () => [...model.todos, { id, title, completed: false }],
        todoDraft: () => '',
      });
      const commands = persistTodos(nextModel);

      return Array.isArrayEmpty(commands)
        ? { model: nextModel }
        : { model: nextModel, commands };
    },
    ToggledTodo: ({ id }) => {
      const nextModel = modifyFields(model, {
        todos: () =>
          Array.map(model.todos, todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo,
          ),
      });
      const commands = persistTodos(nextModel);

      return Array.isArrayEmpty(commands)
        ? { model: nextModel }
        : { model: nextModel, commands };
    },
    DeletedTodo: ({ id }) => {
      const nextModel = modifyFields(model, {
        todos: () => Array.filter(model.todos, todo => todo.id !== id),
      });
      const commands = persistTodos(nextModel);

      return Array.isArrayEmpty(commands)
        ? { model: nextModel }
        : { model: nextModel, commands };
    },
    LoadedTodos: ({ todos }) => ({
      model: modifyFields(model, { todos: () => todos }),
    }),
    CompletedPersistTodos: () => ({ model }),
    FailedGoogleLogin: ({ reason }) => {
      const nextModel = modifyFields(model, {
        maybeLoginError: () => Option.some(reason),
      });
      const commands = authRedirect(nextModel);

      return Array.isArrayEmpty(commands)
        ? { model: nextModel }
        : { model: nextModel, commands };
    },
  });
