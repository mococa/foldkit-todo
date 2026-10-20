import { Data, Effect, Schema, pipe } from 'effect';
import { Route } from 'foldkit';
import type { Html, HtmlBuilder } from 'foldkit/html';
import {
  type Biparser,
  type Router,
  defineRouteUnion,
  int,
  literal,
  root,
  schemaSegment,
  slash,
  string,
} from 'foldkit/route';
import type { CallableTaggedStruct } from 'foldkit/schema';

/** The subset of app state passed to a page view: its typed route. */
export type FrameworkPageModel<
  Route = Readonly<{ _tag: string; path?: string }>,
> = Readonly<{ route: Route }>;

type RouteValue<
  Tag extends string,
  Fields extends Schema.Struct.Fields,
> = Readonly<{ _tag: Tag } & Schema.Struct.Type<Fields>>;

/** Shape of a single `<meta>` tag managed by the framework. */
export const FrameworkHeadTag = Schema.Struct({
  attribute: Schema.Literals(['name', 'property', 'http-equiv', 'itemprop']),
  key: Schema.String,
  content: Schema.optional(Schema.String),
});

export type FrameworkHeadTag = typeof FrameworkHeadTag.Type;

/** Fully resolved page metadata used to render head tags. */
export const FrameworkMetadata = Schema.Struct({
  title: Schema.String,
  description: Schema.optional(Schema.String),
  image: Schema.optional(Schema.String),
  imageAlt: Schema.optional(Schema.String),
  canonical: Schema.optional(Schema.String),
  ogUrl: Schema.optional(Schema.String),
  ogType: Schema.optional(Schema.String),
  locale: Schema.optional(Schema.String),
  robots: Schema.optional(Schema.String),
  noIndex: Schema.optional(Schema.Boolean),
  twitterSite: Schema.optional(Schema.String),
  twitterCreator: Schema.optional(Schema.String),
  keywords: Schema.optional(Schema.String),
  author: Schema.optional(Schema.String),
  extraHeadTags: Schema.optional(Schema.Array(FrameworkHeadTag)),
  rawHead: Schema.optional(Schema.String),
});

export type FrameworkMetadata = typeof FrameworkMetadata.Type;

/** Partial metadata supplied by a page or the router defaults. */
export const FrameworkMetadataOverrides = Schema.Struct({
  title: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  image: Schema.optional(Schema.String),
  imageAlt: Schema.optional(Schema.String),
  canonical: Schema.optional(Schema.String),
  ogUrl: Schema.optional(Schema.String),
  ogType: Schema.optional(Schema.String),
  locale: Schema.optional(Schema.String),
  robots: Schema.optional(Schema.String),
  noIndex: Schema.optional(Schema.Boolean),
  twitterSite: Schema.optional(Schema.String),
  twitterCreator: Schema.optional(Schema.String),
  keywords: Schema.optional(Schema.String),
  author: Schema.optional(Schema.String),
  extraHeadTags: Schema.optional(Schema.Array(FrameworkHeadTag)),
  rawHead: Schema.optional(Schema.String),
});

export type FrameworkMetadataOverrides = typeof FrameworkMetadataOverrides.Type;

/** Raised when `fallbackTag` does not match any registered page. */
export class MissingFallbackRoute extends Data.TaggedError(
  'MissingFallbackRoute',
)<{ tag: string }> {}

/** Raised when a `:param` in a path has no matching route schema. */
export class MissingRouteSchema extends Data.TaggedError('MissingRouteSchema')<{
  param: string;
}> {}

/** Raised when two pages declare the same route tag. */
export class DuplicateRouteTag extends Data.TaggedError('DuplicateRouteTag')<{
  tag: string;
}> {}

/** Raised when a route has no page in the registry. */
export class MissingPageForRoute extends Data.TaggedError(
  'MissingPageForRoute',
)<{ tag: string }> {}

/** Raised for an unexpected failure while building a router. */
export class RouterBuildFailure extends Data.TaggedError('RouterBuildFailure')<{
  message: string;
}> {}

/** Every failure `defineRouterEffect` can report. */
export type RouterBuildError =
  | MissingFallbackRoute
  | MissingRouteSchema
  | DuplicateRouteTag
  | MissingPageForRoute
  | RouterBuildFailure;

type PathParams<Path extends string> = Path extends `${string}:${infer Rest}`
  ? Rest extends `${infer Param}/${infer Tail}`
    ? Param | PathParams<Tail>
    : Rest extends `${infer Param}`
      ? Param
      : never
  : never;

type CanAutoRouter<
  Path extends string | undefined,
  Fields extends Schema.Struct.Fields,
> = Path extends string
  ? Path extends `${string}:${string}`
    ? [PathParams<Path>] extends [Extract<keyof Fields, string>]
      ? [Extract<keyof Fields, string>] extends [PathParams<Path>]
        ? true
        : false
      : false
    : [Extract<keyof Fields, string>] extends [never]
      ? true
      : false
  : false;

export type SitemapChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

/** Per-page sitemap policy. `false` excludes the page. */
export type PageSitemap = Readonly<{
  priority?: number;
  changeFrequency?: SitemapChangeFrequency;
  images?: ReadonlyArray<string>;
}>;

/** A concrete sitemap URL, usually used for parameterized routes. */
export type SitemapEntry = Readonly<{
  path: string;
  lastModified?: string;
  priority?: number;
  changeFrequency?: SitemapChangeFrequency;
  images?: ReadonlyArray<string>;
}>;

/** Sitemap generation settings. Literal pages are included by default. */
export type RouterSitemapConfig = Readonly<{
  origin: string;
  entries?: ReadonlyArray<SitemapEntry>;
}>;

type PageFields<
  Tag extends string,
  Fields extends Schema.Struct.Fields,
> = Readonly<{
  tag: Tag;
  metadata: FrameworkMetadataOverrides;
  sitemap?: false | PageSitemap;
  view: <Message>(
    model: FrameworkPageModel<RouteValue<Tag, Fields>>,
    h: HtmlBuilder<Message>,
  ) => Html;
}>;

type PageRouter<
  Tag extends string,
  Fields extends Schema.Struct.Fields,
> = (routes: {
  [K in Tag]: CallableTaggedStruct<K, Fields>;
}) => Router<ReturnType<CallableTaggedStruct<Tag, Fields>>>;

type RouteInput<Fields extends Schema.Struct.Fields> =
  keyof Fields extends never ? { route?: Fields } : { route: Fields };

type CreateRouterInput<
  Tag extends string,
  Fields extends Schema.Struct.Fields,
  Path extends string | undefined,
> = Path extends undefined
  ? { createRouter?: never }
  : CanAutoRouter<Path, Fields> extends true
    ? { createRouter?: PageRouter<Tag, Fields> }
    : { createRouter: PageRouter<Tag, Fields> };

/** A page's route, metadata, optional custom parser, and typed view. */
export type PageDefinition<
  Tag extends string = string,
  Fields extends Schema.Struct.Fields = {},
  Path extends string | undefined = string | undefined,
> = PageFields<Tag, Fields> &
  Readonly<{ path: Path }> &
  RouteInput<Fields> &
  CreateRouterInput<Tag, Fields, Path>;

/** Types a page object and infers its tag, route fields, and path. */
export const definePage = <
  const Tag extends string,
  const Fields extends Schema.Struct.Fields = {},
  const Path extends string | undefined = string | undefined,
>(
  page: PageDefinition<Tag, Fields, Path>,
): PageDefinition<Tag, Fields, Path> => page;

type AnyPage = Readonly<{
  tag: string;
  path: string | undefined;
  route?: Schema.Struct.Fields;
  metadata: FrameworkMetadataOverrides;
  sitemap?: false | PageSitemap;
  view: unknown;
  createRouter?: unknown;
}>;

type TaggedUnionProperty = keyof Schema.TaggedUnion<{}>;
type UnionProperty = TaggedUnionProperty | 'members' | 'subset';

type VariantNameCollision<Name extends PropertyKey> = Readonly<{
  'Variant names must not conflict with union properties': Name;
}>;

type ValidateVariantNames<
  CasesByTag extends Record<string, Schema.Struct.Fields>,
> =
  Extract<keyof CasesByTag, UnionProperty> extends infer Name
    ? [Name] extends [never]
      ? unknown
      : VariantNameCollision<Name & PropertyKey>
    : never;

type ValidCases<Cases extends Record<string, Schema.Struct.Fields>> = Cases &
  ValidateVariantNames<Cases>;

type RouteCases<Pages extends ReadonlyArray<AnyPage>> = {
  [Page in Pages[number] as Page['tag']]: Page['route'] extends undefined
    ? {}
    : NonNullable<Page['route']>;
};

type PagesByTag<Pages extends ReadonlyArray<AnyPage>> = {
  [Page in Pages[number] as Page['tag']]: Page;
};

const entriesToRecord = <RecordType>(
  entries: ReadonlyArray<readonly [string, unknown]>,
): RecordType =>
  // oxlint-disable-next-line typescript/consistent-type-assertions
  Object.fromEntries(entries) as RecordType;

const asSegmentCodec = (
  schema: Schema.Constraint,
): Schema.Codec<unknown, string> =>
  // oxlint-disable-next-line typescript/consistent-type-assertions
  schema as Schema.Codec<unknown, string>;

const routeTag = (route: unknown): string =>
  // oxlint-disable-next-line typescript/consistent-type-assertions
  (route as { _tag: string })._tag;

const asRoutes = (routes: unknown): Record<string, unknown> =>
  // oxlint-disable-next-line typescript/consistent-type-assertions
  routes as Record<string, unknown>;

const asUnknownRouter = (router: unknown): Router<unknown> =>
  // oxlint-disable-next-line typescript/consistent-type-assertions
  router as Router<unknown>;

const asRouter = <Routes>(
  createRouter: unknown,
): ((routes: Routes) => Router<unknown>) =>
  // oxlint-disable-next-line typescript/consistent-type-assertions
  createRouter as (routes: Routes) => Router<unknown>;

const asFallbackConstructor = <Route>(
  route: unknown,
): { make: (data: { path: string }) => Route } =>
  // oxlint-disable-next-line typescript/consistent-type-assertions
  route as { make: (data: { path: string }) => Route };

const routeConstructor = <Route>(
  constructor: unknown,
): { make: (data: Record<string, unknown>) => Route } => ({
  make: data =>
    // oxlint-disable-next-line typescript/consistent-type-assertions
    (constructor as (data: Record<string, unknown>) => Route)(data),
});

const appendPage = <Pages extends ReadonlyArray<AnyPage>, Page extends AnyPage>(
  pages: Pages,
  page: Page,
): readonly [...Pages, Page] =>
  // oxlint-disable-next-line typescript/consistent-type-assertions
  [...pages, page] as readonly [...Pages, Page];

const asParser = <A>(parser: Biparser<A>): Biparser<Record<string, unknown>> =>
  // oxlint-disable-next-line typescript/consistent-type-assertions
  parser as Biparser<Record<string, unknown>>;

const segmentParser = (
  route: Schema.Struct.Fields,
  name: string,
): Biparser<Record<string, unknown>> => {
  const schema = route[name];

  if (schema === undefined) {
    throw new MissingRouteSchema({ param: name });
  }

  if (schema === Schema.Number) {
    return asParser(int(name));
  }

  if (schema === Schema.String) {
    return asParser(string(name));
  }

  return asParser(schemaSegment(name, asSegmentCodec(schema)));
};

const buildPathParser = (
  path: string,
  route: Schema.Struct.Fields,
): Biparser<Record<string, unknown>> => {
  const parser = path
    .split('/')
    .filter(segment => segment !== '')
    .reduce<Biparser<Record<string, unknown>> | undefined>(
      (current, segment) => {
        const next = segment.startsWith(':')
          ? segmentParser(route, segment.slice(1))
          : asParser(literal(segment));

        return current === undefined ? next : pipe(current, slash(next));
      },
      undefined,
    );

  return parser ?? asParser(root);
};

const escapeAttributeValue = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

const dedupeHeadTags = (
  tags: ReadonlyArray<FrameworkHeadTag>,
): ReadonlyArray<FrameworkHeadTag> => {
  const byKey = new Map<string, FrameworkHeadTag>();

  tags.forEach(tag => {
    byKey.set(`${tag.attribute}:${tag.key}`, tag);
  });

  return Array.from(byKey.values());
};

const mergeMetadata = (
  siteName: string,
  defaults: FrameworkMetadataOverrides,
  metadata: FrameworkMetadataOverrides,
): FrameworkMetadata => ({
  title: metadata.title ?? defaults.title ?? siteName,
  description: metadata.description ?? defaults.description,
  image: metadata.image ?? defaults.image,
  imageAlt: metadata.imageAlt ?? defaults.imageAlt,
  canonical: metadata.canonical ?? defaults.canonical,
  ogUrl: metadata.ogUrl ?? defaults.ogUrl,
  ogType: metadata.ogType ?? defaults.ogType,
  locale: metadata.locale ?? defaults.locale,
  robots: metadata.robots ?? defaults.robots,
  noIndex: metadata.noIndex ?? defaults.noIndex,
  twitterSite: metadata.twitterSite ?? defaults.twitterSite,
  twitterCreator: metadata.twitterCreator ?? defaults.twitterCreator,
  keywords: metadata.keywords ?? defaults.keywords,
  author: metadata.author ?? defaults.author,
  extraHeadTags: dedupeHeadTags([
    ...(defaults.extraHeadTags ?? []),
    ...(metadata.extraHeadTags ?? []),
  ]),
  rawHead: metadata.rawHead ?? defaults.rawHead,
});

/** Builds the meta tags for a page, replacing the default tag set. */
export type HeadTagFactory = (
  siteName: string,
  metadata: FrameworkMetadata,
) => ReadonlyArray<FrameworkHeadTag>;

const defaultHeadTags = (
  siteName: string,
  metadata: FrameworkMetadata,
): ReadonlyArray<FrameworkHeadTag> => [
  { attribute: 'property', key: 'og:site_name', content: siteName },
  { attribute: 'property', key: 'og:title', content: metadata.title },
  { attribute: 'name', key: 'twitter:title', content: metadata.title },
  { attribute: 'name', key: 'description', content: metadata.description },
  {
    attribute: 'property',
    key: 'og:description',
    content: metadata.description,
  },
  {
    attribute: 'name',
    key: 'twitter:description',
    content: metadata.description,
  },
  { attribute: 'property', key: 'og:image', content: metadata.image },
  { attribute: 'name', key: 'twitter:image', content: metadata.image },
  {
    attribute: 'property',
    key: 'og:image:alt',
    content: metadata.imageAlt,
  },
  {
    attribute: 'name',
    key: 'twitter:image:alt',
    content: metadata.imageAlt,
  },
  {
    attribute: 'name',
    key: 'twitter:card',
    content: metadata.image === undefined ? undefined : 'summary_large_image',
  },
  {
    attribute: 'property',
    key: 'og:type',
    content: metadata.ogType ?? 'website',
  },
  { attribute: 'property', key: 'og:url', content: metadata.ogUrl },
  { attribute: 'property', key: 'og:locale', content: metadata.locale },
  {
    attribute: 'name',
    key: 'robots',
    content: metadata.noIndex === true ? 'noindex' : metadata.robots,
  },
  { attribute: 'name', key: 'twitter:site', content: metadata.twitterSite },
  {
    attribute: 'name',
    key: 'twitter:creator',
    content: metadata.twitterCreator,
  },
  { attribute: 'name', key: 'keywords', content: metadata.keywords },
  { attribute: 'name', key: 'author', content: metadata.author },
];

const headTags = (
  siteName: string,
  metadata: FrameworkMetadata,
  factory?: HeadTagFactory,
): ReadonlyArray<FrameworkHeadTag> =>
  dedupeHeadTags([
    ...(factory === undefined
      ? defaultHeadTags(siteName, metadata)
      : factory(siteName, metadata)),
    ...(metadata.extraHeadTags ?? []),
  ]);

const renderHeadTags = (
  siteName: string,
  metadata: FrameworkMetadata,
  factory?: HeadTagFactory,
): string => {
  const canonical =
    metadata.canonical === undefined
      ? []
      : [
          `<link rel="canonical" href="${escapeAttributeValue(metadata.canonical)}">`,
        ];

  const meta = headTags(siteName, metadata, factory).flatMap(tag => {
    if (tag.content === undefined) {
      return [];
    }

    return [
      `<meta ${tag.attribute}="${tag.key}" content="${escapeAttributeValue(tag.content)}">`,
    ];
  });

  const raw = metadata.rawHead === undefined ? [] : [metadata.rawHead];

  return [...canonical, ...meta, ...raw].join('\n');
};

/** Router-wide defaults: site name, fallback page, metadata, head tags. */
const normalizePath = (path: string): string => {
  if (path === '' || path === '/') {
    return '/';
  }

  return path.startsWith('/') ? path : `/${path}`;
};

const absoluteUrl = (origin: string, path: string): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const base = origin.endsWith('/') ? origin.slice(0, -1) : origin;

  return `${base}${normalizePath(path)}`;
};

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const renderSitemapEntry = (origin: string, entry: SitemapEntry): string => {
  const lines = [
    '  <url>',
    `    <loc>${escapeXml(absoluteUrl(origin, entry.path))}</loc>`,
  ];

  if (entry.lastModified !== undefined) {
    lines.push(`    <lastmod>${escapeXml(entry.lastModified)}</lastmod>`);
  }

  if (entry.changeFrequency !== undefined) {
    lines.push(`    <changefreq>${entry.changeFrequency}</changefreq>`);
  }

  if (entry.priority !== undefined) {
    lines.push(`    <priority>${entry.priority}</priority>`);
  }

  entry.images?.forEach(image => {
    lines.push(
      `    <image:image><image:loc>${escapeXml(absoluteUrl(origin, image))}</image:loc></image:image>`,
    );
  });

  lines.push('  </url>');

  return lines.join('\n');
};

const renderSitemap = (
  origin: string,
  entries: ReadonlyArray<SitemapEntry>,
): string => {
  const hasImages = entries.some(
    entry => entry.images !== undefined && entry.images.length > 0,
  );
  const urlset = hasImages
    ? '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
    : '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    urlset,
    ...entries.map(entry => renderSitemapEntry(origin, entry)),
    '</urlset>',
  ].join('\n');
};

export type RouterFrameworkConfig = Readonly<{
  siteName: string;
  fallbackTag: string;
  defaultMetadata?: FrameworkMetadataOverrides;
  headTags?: HeadTagFactory | undefined;
  sitemap?: RouterSitemapConfig | undefined;
}>;

/** Builds typed routes, a page registry, metadata helpers, and a URL parser. */
export const defineRouter = <const Pages extends ReadonlyArray<AnyPage>>(
  config: RouterFrameworkConfig,
  pages: Pages,
) => {
  type PageEntry = Pages[number];
  type RouteCasesOfPages = RouteCases<Pages>;

  const duplicate = pages.find(
    (page, index) => pages.findIndex(other => other.tag === page.tag) !== index,
  );

  if (duplicate !== undefined) {
    throw new DuplicateRouteTag({ tag: duplicate.tag });
  }

  const routeCases = entriesToRecord<ValidCases<RouteCasesOfPages>>(
    pages.map(page => [page.tag, page.route ?? {}]),
  );

  const AppRoute = defineRouteUnion(routeCases);

  type AppRoute = typeof AppRoute.Type;

  const pageRegistry = entriesToRecord<PagesByTag<Pages>>(
    pages.map(page => [page.tag, page]),
  );

  const pageForRoute = (route: AppRoute): PageEntry => {
    const tag = routeTag(route);
    const page = pages.find(entry => entry.tag === tag);

    if (page === undefined) {
      throw new MissingPageForRoute({ tag });
    }

    return page;
  };

  const pageMetadata = (route: AppRoute): FrameworkMetadata =>
    mergeMetadata(
      config.siteName,
      config.defaultMetadata ?? {},
      pageForRoute(route).metadata,
    );

  const allMetadata: ReadonlyArray<FrameworkMetadata> = pages.map(page =>
    mergeMetadata(config.siteName, config.defaultMetadata ?? {}, page.metadata),
  );

  const metadataForTitle = (title: string): FrameworkMetadata | undefined =>
    allMetadata.find(metadata => metadata.title === title);

  const routerFor = (page: PageEntry): Router<unknown> | undefined => {
    if (page.createRouter !== undefined) {
      return asRouter<Record<string, unknown>>(page.createRouter)(
        asRoutes(AppRoute),
      );
    }

    if (page.path === undefined) {
      return undefined;
    }

    return asUnknownRouter(
      pipe(
        buildPathParser(page.path, page.route ?? {}),
        Route.mapTo(
          routeConstructor<AppRoute>(
            // oxlint-disable-next-line typescript/consistent-type-assertions
            AppRoute[page.tag as keyof typeof AppRoute],
          ),
        ),
      ),
    );
  };

  const routeParser = Route.oneOf(
    ...pages.flatMap(page => {
      const router = routerFor(page);

      return router === undefined ? [] : [router];
    }),
  );

  // oxlint-disable-next-line typescript/consistent-type-assertions
  const fallbackRoute = AppRoute[config.fallbackTag as keyof typeof AppRoute];

  if (fallbackRoute === undefined) {
    throw new MissingFallbackRoute({ tag: config.fallbackTag });
  }

  const urlToAppRoute = Route.parseUrlWithFallback(
    routeParser,
    asFallbackConstructor<AppRoute>(fallbackRoute),
  );

  const defaultMetadata = mergeMetadata(
    config.siteName,
    {},
    config.defaultMetadata ?? {},
  );

  const autoSitemapEntries = pages.flatMap(page => {
    const sitemap = page.sitemap;

    if (
      page.path === undefined ||
      page.path.includes(':') ||
      sitemap === false ||
      page.metadata.noIndex === true
    ) {
      return [];
    }

    return [{ path: normalizePath(page.path), ...(sitemap ?? {}) }];
  });

  const sitemapByPath = new Map<string, SitemapEntry>();

  autoSitemapEntries.forEach(entry => {
    sitemapByPath.set(entry.path, entry);
  });

  config.sitemap?.entries?.forEach(entry => {
    const path = normalizePath(entry.path);
    sitemapByPath.set(path, { ...sitemapByPath.get(path), ...entry, path });
  });

  const sitemapEntries =
    config.sitemap === undefined
      ? undefined
      : Array.from(sitemapByPath.values());

  const sitemap =
    config.sitemap === undefined || sitemapEntries === undefined
      ? undefined
      : renderSitemap(config.sitemap.origin, sitemapEntries);

  const robotsTxt =
    config.sitemap === undefined
      ? undefined
      : `Sitemap: ${absoluteUrl(config.sitemap.origin, '/sitemap.xml')}\n`;

  const viewForRoute = <Message>(
    route: AppRoute,
    h: HtmlBuilder<Message>,
  ): Html => {
    const page = pageForRoute(route);

    // oxlint-disable-next-line typescript/consistent-type-assertions
    const view = page.view as unknown as (
      model: FrameworkPageModel<AppRoute>,
      h: HtmlBuilder<Message>,
    ) => Html;

    return view({ route }, h);
  };

  return {
    AppRoute,
    PageRegistry: pageRegistry,
    pageForRoute,
    viewForRoute,
    pageMetadata,
    metadataForTitle,
    urlToAppRoute,
    defaultMetadata,
    sitemapEntries,
    sitemap,
    robotsTxt,
    headTags: (metadata: FrameworkMetadata) =>
      headTags(config.siteName, metadata, config.headTags),
    renderHeadTags: (metadata: FrameworkMetadata) =>
      renderHeadTags(config.siteName, metadata, config.headTags),
  };
};

/** Effect-returning `defineRouter` for callers that handle build failures. */
export const defineRouterEffect = <const Pages extends ReadonlyArray<AnyPage>>(
  config: RouterFrameworkConfig,
  pages: Pages,
) =>
  Effect.try({
    try: () => defineRouter(config, pages),
    catch: (error: unknown): RouterBuildError => {
      if (
        error instanceof MissingFallbackRoute ||
        error instanceof MissingRouteSchema ||
        error instanceof DuplicateRouteTag ||
        error instanceof MissingPageForRoute
      ) {
        return error;
      }

      return new RouterBuildFailure({
        message:
          error instanceof Error ? error.message : 'Unknown router build error',
      });
    },
  });

/** Mutable config holder for defaults; create routes with `routes` or `route().build()`. */
export class RouterFramework {
  private readonly siteName: string;
  private readonly fallbackTag: string;
  private readonly headTagsFactory: HeadTagFactory | undefined;
  private defaultMetadata: FrameworkMetadataOverrides;

  constructor(config: RouterFrameworkConfig) {
    this.siteName = config.siteName;
    this.fallbackTag = config.fallbackTag;
    this.headTagsFactory = config.headTags;
    this.defaultMetadata = config.defaultMetadata ?? {};
  }

  setDefaultMetadata(metadata: FrameworkMetadataOverrides): this {
    this.defaultMetadata = metadata;
    return this;
  }

  head(metadata: FrameworkMetadata): ReadonlyArray<FrameworkHeadTag> {
    return headTags(this.siteName, metadata, this.headTagsFactory);
  }

  renderHead(metadata: FrameworkMetadata): string {
    return renderHeadTags(this.siteName, metadata, this.headTagsFactory);
  }

  route<const Page extends AnyPage>(
    page: Page,
  ): RouterBuilder<readonly [Page]> {
    return new RouterBuilder<readonly [Page]>(this.config(), [page]);
  }

  routes<const Pages extends ReadonlyArray<AnyPage>>(pages: Pages) {
    return defineRouter(this.config(), pages);
  }

  private config(): RouterFrameworkConfig {
    return {
      siteName: this.siteName,
      fallbackTag: this.fallbackTag,
      defaultMetadata: this.defaultMetadata,
      headTags: this.headTagsFactory,
    };
  }
}

/** Immutable fluent builder that accumulates pages and preserves route types. */
export class RouterBuilder<Pages extends ReadonlyArray<AnyPage>> {
  constructor(
    private readonly config: RouterFrameworkConfig,
    private readonly pages: Pages,
  ) {}

  route<const Page extends AnyPage>(
    page: Page,
  ): RouterBuilder<readonly [...Pages, Page]> {
    return new RouterBuilder(this.config, appendPage(this.pages, page));
  }

  build() {
    return defineRouter(this.config, this.pages);
  }
}
