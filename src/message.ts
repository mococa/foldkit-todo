import { Schema } from 'effect';
import { defineMessageUnion } from 'foldkit/message';
import { UrlRequest } from 'foldkit/navigation';
import { Url } from 'foldkit/url';

import { Session } from './domain/session';

export const Message = defineMessageUnion({
  ClickedLink: { request: UrlRequest },
  ChangedUrl: { url: Url },
  CompletedNavigateInternal: {},
  CompletedLoadExternal: {},
  CompletedSyncDocumentMetadata: {},
  SucceededGoogleLogin: { session: Session },
  FailedGoogleLogin: { reason: Schema.String },
});

export type Message = typeof Message.Type;
