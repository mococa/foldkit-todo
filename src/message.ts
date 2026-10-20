import { Schema } from 'effect';
import { defineMessageUnion } from 'foldkit/message';
import { UrlRequest } from 'foldkit/navigation';
import { Url } from 'foldkit/url';

import { Session } from './domain/session';
import { Todo } from './domain/todo';

export const Message = defineMessageUnion({
  ClickedLink: { request: UrlRequest },
  ChangedUrl: { url: Url },
  CompletedNavigateInternal: {},
  CompletedLoadExternal: {},
  CompletedSyncDocumentMetadata: {},
  SucceededGoogleLogin: { session: Session },
  FailedGoogleLogin: { reason: Schema.String },
  LoadedSession: { maybeSession: Schema.Option(Session) },
  ClickedLogout: {},
  CompletedLogout: { maybeError: Schema.Option(Schema.String) },
  ChangedTodoDraft: { value: Schema.String },
  SubmittedTodo: {},
  CreatedTodo: { id: Schema.String, title: Schema.String },
  ToggledTodo: { id: Schema.String },
  DeletedTodo: { id: Schema.String },
  LoadedTodos: { todos: Schema.Array(Todo) },
  CompletedPersistTodos: {},
});

export type Message = typeof Message.Type;
