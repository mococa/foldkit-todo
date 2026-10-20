import { Effect, Option } from 'effect';
import { given, message, model, story } from 'foldkit/story';
import { fromString as urlFromString } from 'foldkit/url';
import { describe, expect, test } from 'vitest';

import { Message, NotFoundPage, init, routes, update } from './fixture';
import { defineRouterEffect } from './router';

const userUrl = Option.getOrThrow(
  urlFromString('https://example.com/users/42'),
);
const postUrl = Option.getOrThrow(
  urlFromString('https://example.com/users/7/posts/42'),
);
const fileUrl = Option.getOrThrow(
  urlFromString('https://example.com/users/7/files/notes.txt'),
);

describe('router library', () => {
  test('merges page metadata over defaults', () => {
    const metadata = routes.pageMetadata(routes.AppRoute.Home());

    expect(metadata.title).toBe('Home');
    expect(metadata.description).toBe('Default description');
  });

  test('adds noindex for the fallback page', () => {
    const metadata = routes.pageMetadata(
      routes.AppRoute.NotFound({ path: '/x' }),
    );
    const tags = routes.headTags(metadata);

    expect(tags).toContainEqual({
      attribute: 'name',
      key: 'robots',
      content: 'noindex',
    });
  });

  test('parses a single param route', () => {
    expect(routes.urlToAppRoute(userUrl)).toEqual({ _tag: 'User', id: 42 });
  });

  test('parses multiple nested numeric params', () => {
    expect(routes.urlToAppRoute(postUrl)).toEqual({
      _tag: 'Post',
      userId: 7,
      postId: 42,
    });
  });

  test('parses mixed numeric and string params', () => {
    expect(routes.urlToAppRoute(fileUrl)).toEqual({
      _tag: 'File',
      userId: 7,
      fileName: 'notes.txt',
    });
  });

  test('defineRouterEffect resolves a router', () => {
    const built = Effect.runSync(
      defineRouterEffect(
        {
          siteName: 'Effect Router',
          fallbackTag: 'NotFound',
        },
        [NotFoundPage],
      ),
    );

    expect(built.AppRoute.NotFound({ path: '/x' })._tag).toBe('NotFound');
  });

  test('defineRouterEffect reports a missing fallback', () => {
    const result = Effect.runSync(
      Effect.result(
        defineRouterEffect(
          {
            siteName: 'Effect Router',
            fallbackTag: 'Missing',
          },
          [NotFoundPage],
        ),
      ),
    );

    expect(result._tag).toBe('Failure');
  });

  test('updates the route from a message', () => {
    story(
      update,
      given(init()),
      message(
        Message.ChangedRoute({
          route: routes.AppRoute.Post({ userId: 7, postId: 42 }),
        }),
      ),
      model(model => {
        expect(model.route._tag).toBe('Post');

        if (model.route._tag === 'Post') {
          expect(model.route.userId).toBe(7);
          expect(model.route.postId).toBe(42);
        }
      }),
    );
  });
});
