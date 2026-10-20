import { Effect, Schema } from 'effect';
import { Command, type Update } from 'foldkit';
import { defineMessageUnion } from 'foldkit/message';
import { UrlRequest, load, pushUrl } from 'foldkit/navigation';
import { modifyFields } from 'foldkit/struct';
import { Url, toString as urlToString } from 'foldkit/url';

import type { Model } from './main';
import { type HeadTag, PageMetadata, headTags } from './page/metadata';
import { pageMetadata } from './page/registry';
import { urlToAppRoute } from './route';

// MESSAGE

export const Message = defineMessageUnion({
  ClickedLink: { request: UrlRequest },
  ChangedUrl: { url: Url },
  CompletedNavigateInternal: {},
  CompletedLoadExternal: {},
  CompletedSyncDocumentMetadata: {},
});

export type Message = typeof Message.Type;

// COMMAND

const NavigateInternal = Command.define('NavigateInternal', {
  args: { url: Schema.String },
  messages: [Message.CompletedNavigateInternal],
  execute: ({ url }) =>
    pushUrl(url).pipe(Effect.as(Message.CompletedNavigateInternal())),
});

const LoadExternal = Command.define('LoadExternal', {
  args: { href: Schema.String },
  messages: [Message.CompletedLoadExternal],
  execute: ({ href }) =>
    load(href).pipe(Effect.as(Message.CompletedLoadExternal())),
});

const syncHeadTag = (tag: HeadTag): void => {
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

const SyncDocumentMetadata = Command.define('SyncDocumentMetadata', {
  args: { metadata: PageMetadata },
  messages: [Message.CompletedSyncDocumentMetadata],
  execute: ({ metadata }) =>
    Effect.forEach(
      headTags(metadata),
      tag =>
        Effect.sync(() => {
          syncHeadTag(tag);
        }),
      { discard: true },
    ).pipe(Effect.as(Message.CompletedSyncDocumentMetadata())),
});

// UPDATE

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
          SyncDocumentMetadata({ metadata: pageMetadata(nextModel.route) }),
        ],
      };
    },
    CompletedNavigateInternal: () => ({ model }),
    CompletedLoadExternal: () => ({ model }),
    CompletedSyncDocumentMetadata: () => ({ model }),
  });
