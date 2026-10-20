import { Schema } from 'effect';
import { defineMessageUnion } from 'foldkit/message';
import { UrlRequest } from 'foldkit/navigation';
import { Url } from 'foldkit/url';

import { Session } from './domain/session';
import { Message as TodoMessage } from './page/todo/logic/message';

export const Message = defineMessageUnion({
  ClickedLink: { request: UrlRequest },
  ChangedUrl: { url: Url },
  CompletedNavigateInternal: {},
  CompletedLoadExternal: {},
  CompletedSyncDocumentMetadata: {},
  SucceededGoogleLogin: { session: Session },
  FailedGoogleLogin: { reason: Schema.String },
  LoadedSession: { maybeSession: Schema.Option(Session) },
  CompletedLogout: { maybeError: Schema.Option(Schema.String) },
  GotTodoMessage: { message: TodoMessage },
});

export type Message = typeof Message.Type;
