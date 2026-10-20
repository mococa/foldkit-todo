import { Effect, Option, Schema } from 'effect';
import { Command, type Update } from 'foldkit';
import { UrlRequest, load, pushUrl } from 'foldkit/navigation';
import { modifyFields } from 'foldkit/struct';
import { toString as urlToString } from 'foldkit/url';

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
        ],
      };
    },
    CompletedNavigateInternal: () => ({ model }),
    CompletedLoadExternal: () => ({ model }),
    CompletedSyncDocumentMetadata: () => ({ model }),
    SucceededGoogleLogin: ({ session }) => ({
      model: modifyFields(model, {
        maybeSession: () => Option.some(session),
        maybeLoginError: () => Option.none(),
      }),
      commands: [NavigateTo({ route: AppRoute.Todo() })],
    }),
    FailedGoogleLogin: ({ reason }) => ({
      model: modifyFields(model, {
        maybeLoginError: () => Option.some(reason),
      }),
    }),
  });
