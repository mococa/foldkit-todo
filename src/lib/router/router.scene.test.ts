import { expect, given, scene, text } from 'foldkit/scene';
import { describe, test } from 'vitest';

import { init, routes, update, view } from './fixture';

describe('router library', () => {
  test('renders the home page', () => {
    scene({ update, view }, given(init()), expect(text('Home page')).toExist());
  });

  test('renders the page for the current route', () => {
    scene(
      { update, view },
      given({ route: routes.AppRoute.User({ id: 42 }) }),
      expect(text('User 42')).toExist(),
    );
  });

  test('renders nested route params', () => {
    scene(
      { update, view },
      given({ route: routes.AppRoute.Post({ userId: 7, postId: 42 }) }),
      expect(text('Post 7/42')).toExist(),
    );
  });

  test('renders mixed nested params', () => {
    scene(
      { update, view },
      given({
        route: routes.AppRoute.File({ userId: 7, fileName: 'notes.txt' }),
      }),
      expect(text('File notes.txt of 7')).toExist(),
    );
  });

  test('renders the fallback page', () => {
    scene(
      { update, view },
      given({ route: routes.AppRoute.NotFound({ path: '/missing' }) }),
      expect(text('Not found page')).toExist(),
    );
  });
});
