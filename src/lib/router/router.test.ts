import { Effect, Option, Schema, pipe } from 'effect';
import { Route } from 'foldkit';
import { literal, query } from 'foldkit/route';
import { fromString as urlFromString } from 'foldkit/url';
import { describe, expect, expectTypeOf, test } from 'vitest';

import { HomePage, NotFoundPage, routes } from './fixture';
import {
  DuplicateRouteTag,
  MissingFallbackRoute,
  MissingRouteSchema,
  type PageDefinition,
  RouterFramework,
  definePage,
  defineRouter,
  defineRouterEffect,
} from './router';

const url = (value: string) => Option.getOrThrow(urlFromString(value));

const config = {
  siteName: 'Library',
  fallbackTag: 'NotFound',
} as const;

const RootPage: PageDefinition<'Root', {}, ''> = {
  tag: 'Root',
  path: '',
  metadata: { title: 'Root' },
  view: (_model, h) => h.p([], ['Root page']),
};

const SearchPage: PageDefinition<
  'Search',
  { q: typeof Schema.String },
  'search'
> = {
  tag: 'Search',
  path: 'search',
  route: { q: Schema.String },
  createRouter: routes =>
    pipe(
      literal('search'),
      query(Schema.Struct({ q: Schema.String })),
      Route.mapTo(routes.Search),
    ),
  metadata: { title: 'Search' },
  view: (model, h) => h.p([], [`Search ${model.route.q}`]),
};

const RichPage: PageDefinition<'Rich', {}, 'rich'> = {
  tag: 'Rich',
  path: 'rich',
  metadata: {
    title: 'Rich',
    description: 'Page description',
    image: '/page.png',
    imageAlt: 'Page image',
    canonical: 'https://example.com/rich?a=1&b=2',
    ogUrl: 'https://example.com/rich',
    ogType: 'article',
    locale: 'en_US',
    twitterSite: '@site',
    twitterCreator: '@creator',
    keywords: 'one,two',
    author: 'Author',
    noIndex: true,
    extraHeadTags: [
      { attribute: 'name', key: 'theme-color', content: '#000000' },
      { attribute: 'name', key: 'shared', content: 'page' },
    ],
    rawHead: '<script type="application/ld+json">{}</script>',
  },
  view: (_model, h) => h.p([], ['Rich page']),
};

const richRoutes = defineRouter(
  {
    siteName: 'Site',
    fallbackTag: 'NotFound',
    defaultMetadata: {
      description: 'Default description',
      image: '/default.png',
      extraHeadTags: [
        { attribute: 'name', key: 'shared', content: 'default' },
        { attribute: 'name', key: 'default-only', content: 'yes' },
      ],
    },
  },
  [RichPage, NotFoundPage],
);

describe('defineRouter', () => {
  test('parses literal and root paths', () => {
    expect(routes.urlToAppRoute(url('https://example.com/home'))).toEqual({
      _tag: 'Home',
    });

    const rootRoutes = defineRouter(config, [RootPage, NotFoundPage]);

    expect(rootRoutes.urlToAppRoute(url('https://example.com/'))).toEqual({
      _tag: 'Root',
    });
  });

  test('parses nested and mixed params', () => {
    expect(
      routes.urlToAppRoute(url('https://example.com/users/7/posts/42')),
    ).toEqual({ _tag: 'Post', userId: 7, postId: 42 });

    expect(
      routes.urlToAppRoute(url('https://example.com/users/7/files/notes.txt')),
    ).toEqual({ _tag: 'File', userId: 7, fileName: 'notes.txt' });
  });

  test('falls back for unmatched URLs', () => {
    expect(
      routes.urlToAppRoute(url('https://example.com/missing')),
    ).toMatchObject({ _tag: 'NotFound', path: '/missing' });
  });

  test('supports a custom query parser', () => {
    const searchRoutes = defineRouter(config, [SearchPage, NotFoundPage]);

    expect(
      searchRoutes.urlToAppRoute(url('https://example.com/search?q=hello')),
    ).toEqual({ _tag: 'Search', q: 'hello' });
  });

  test('keeps literal route types', () => {
    expectTypeOf(routes.AppRoute.Post).toBeCallableWith({
      userId: 1,
      postId: 2,
    });
  });
});

describe('metadata', () => {
  test('merges defaults and page overrides', () => {
    const metadata = richRoutes.pageMetadata(richRoutes.AppRoute.Rich());

    expect(metadata).toMatchObject({
      title: 'Rich',
      description: 'Page description',
      image: '/page.png',
      imageAlt: 'Page image',
      canonical: 'https://example.com/rich?a=1&b=2',
      ogUrl: 'https://example.com/rich',
      ogType: 'article',
      locale: 'en_US',
      twitterSite: '@site',
      twitterCreator: '@creator',
      keywords: 'one,two',
      author: 'Author',
      noIndex: true,
    });
  });

  test('merges and dedupes extra head tags', () => {
    const metadata = richRoutes.pageMetadata(richRoutes.AppRoute.Rich());
    const shared = metadata.extraHeadTags?.filter(tag => tag.key === 'shared');

    expect(shared).toEqual([
      { attribute: 'name', key: 'shared', content: 'page' },
    ]);
    expect(metadata.extraHeadTags).toContainEqual({
      attribute: 'name',
      key: 'default-only',
      content: 'yes',
    });
  });

  test('renders every managed meta tag', () => {
    const metadata = richRoutes.pageMetadata(richRoutes.AppRoute.Rich());
    const tags = richRoutes.headTags(metadata);

    expect(tags).toContainEqual({
      attribute: 'property',
      key: 'og:site_name',
      content: 'Site',
    });
    expect(tags).toContainEqual({
      attribute: 'name',
      key: 'robots',
      content: 'noindex',
    });
    expect(tags).toContainEqual({
      attribute: 'property',
      key: 'og:image:alt',
      content: 'Page image',
    });
    expect(tags).toContainEqual({
      attribute: 'property',
      key: 'og:type',
      content: 'article',
    });
    expect(tags).toContainEqual({
      attribute: 'property',
      key: 'og:url',
      content: 'https://example.com/rich',
    });
    expect(tags).toContainEqual({
      attribute: 'property',
      key: 'og:locale',
      content: 'en_US',
    });
    expect(tags).toContainEqual({
      attribute: 'name',
      key: 'twitter:site',
      content: '@site',
    });
    expect(tags).toContainEqual({
      attribute: 'name',
      key: 'twitter:creator',
      content: '@creator',
    });
    expect(tags).toContainEqual({
      attribute: 'name',
      key: 'keywords',
      content: 'one,two',
    });
    expect(tags).toContainEqual({
      attribute: 'name',
      key: 'author',
      content: 'Author',
    });
  });

  test('renders canonical, escaped attributes, and raw head', () => {
    const metadata = richRoutes.pageMetadata(richRoutes.AppRoute.Rich());
    const head = richRoutes.renderHeadTags(metadata);

    expect(head).toContain(
      '<link rel="canonical" href="https://example.com/rich?a=1&amp;b=2">',
    );
    expect(head).toContain('<script type="application/ld+json">{}</script>');
  });

  test('supports a custom head tag factory', () => {
    const customRoutes = defineRouter(
      {
        siteName: 'Site',
        fallbackTag: 'NotFound',
        headTags: (_siteName, metadata) => [
          { attribute: 'property', key: 'og:title', content: metadata.title },
        ],
      },
      [RichPage, NotFoundPage],
    );

    const tags = customRoutes.headTags(
      customRoutes.pageMetadata(customRoutes.AppRoute.Rich()),
    );

    expect(tags).toContainEqual({
      attribute: 'property',
      key: 'og:title',
      content: 'Rich',
    });
    expect(tags).not.toContainEqual(
      expect.objectContaining({ key: 'og:site_name' }),
    );
    expect(tags).toContainEqual({
      attribute: 'name',
      key: 'theme-color',
      content: '#000000',
    });
  });

  test('falls back to site name and default image', () => {
    const PlainPage = definePage({
      tag: 'Plain',
      path: 'plain',
      metadata: {},
      view: (_model, h) => h.empty,
    });
    const plainRoutes = defineRouter(
      {
        ...config,
        defaultMetadata: { image: '/default.png' },
      },
      [PlainPage, NotFoundPage],
    );
    const metadata = plainRoutes.pageMetadata(plainRoutes.AppRoute.Plain());

    expect(metadata.title).toBe('Library');
    expect(metadata.image).toBe('/default.png');
  });

  test('supports the robots field when noIndex is off', () => {
    const RobotsPage = definePage({
      tag: 'Robots',
      path: 'robots',
      metadata: { robots: 'noarchive' },
      view: (_model, h) => h.empty,
    });
    const robotsRoutes = defineRouter(config, [RobotsPage, NotFoundPage]);
    const tags = robotsRoutes.headTags(
      robotsRoutes.pageMetadata(robotsRoutes.AppRoute.Robots()),
    );

    expect(tags).toContainEqual({
      attribute: 'name',
      key: 'robots',
      content: 'noarchive',
    });
  });

  test('exposes the registry and title lookup', () => {
    expect(routes.PageRegistry.Post.tag).toBe('Post');
    expect(
      routes.pageForRoute(routes.AppRoute.File({ userId: 1, fileName: 'a' }))
        .tag,
    ).toBe('File');
    expect(routes.metadataForTitle('User')?.title).toBe('User');
  });
});

describe('RouterFramework', () => {
  test('uses config defaults and head methods', () => {
    const framework = new RouterFramework(config);
    framework.setDefaultMetadata({ description: 'Class default' });

    const built = framework.routes([HomePage, NotFoundPage]);
    const metadata = built.pageMetadata(built.AppRoute.Home());

    expect(metadata.description).toBe('Class default');
    expect(framework.head(metadata)).toContainEqual({
      attribute: 'property',
      key: 'og:title',
      content: 'Home',
    });
    expect(framework.renderHead(metadata)).toContain(
      '<meta property="og:title" content="Home">',
    );
  });

  test('builds through the fluent builder', () => {
    const built = new RouterFramework(config)
      .route(HomePage)
      .route(NotFoundPage)
      .build();

    expect(built.AppRoute.Home()._tag).toBe('Home');
  });
});

describe('errors', () => {
  test('throws typed errors from defineRouter', () => {
    expect(() =>
      defineRouter({ ...config, fallbackTag: 'Missing' }, [HomePage]),
    ).toThrow(MissingFallbackRoute);

    const FirstPage = definePage({
      tag: 'Same',
      path: 'first',
      metadata: { title: 'First' },
      view: (_model, h) => h.empty,
    });
    const SecondPage = definePage({
      tag: 'Same',
      path: 'second',
      metadata: { title: 'Second' },
      view: (_model, h) => h.empty,
    });

    expect(() =>
      defineRouter(config, [FirstPage, SecondPage, NotFoundPage]),
    ).toThrow(DuplicateRouteTag);

    const BrokenPage = {
      tag: 'Broken',
      path: 'users/:id',
      route: {},
      metadata: { title: 'Broken' },
      view: (_model: unknown, h: { empty: null }) => h.empty,
    };

    expect(() => defineRouter(config, [BrokenPage, NotFoundPage])).toThrow(
      MissingRouteSchema,
    );
  });

  test('reports typed failures from defineRouterEffect', () => {
    const failure = Effect.runSync(
      Effect.flip(
        defineRouterEffect({ ...config, fallbackTag: 'Missing' }, [HomePage]),
      ),
    );

    expect(failure._tag).toBe('MissingFallbackRoute');

    const built = Effect.runSync(
      defineRouterEffect(config, [HomePage, NotFoundPage]),
    );

    expect(built.AppRoute.Home()._tag).toBe('Home');
  });
});
