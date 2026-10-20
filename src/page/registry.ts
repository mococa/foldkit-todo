import { Route } from 'foldkit';
import { defineRouteUnion } from 'foldkit/route';

import { LoginPage } from './login';
import { type PageMetadata, mergeMetadata } from './metadata';
import { NotFoundPage } from './not-found';

const pages = [LoginPage, NotFoundPage];

type PageEntry = (typeof pages)[number];
type PagesByTag = { [Page in PageEntry as Page['tag']]: Page };

type RouteCases = { [Tag in keyof PagesByTag]: PagesByTag[Tag]['route'] };

const entriesToRecord = <RecordType>(
  entries: ReadonlyArray<readonly [string, unknown]>,
): RecordType =>
  // oxlint-disable-next-line typescript/consistent-type-assertions
  Object.fromEntries(entries) as RecordType;

const routeCases = entriesToRecord<RouteCases>(
  pages.map(entry => [entry.tag, entry.route]),
);

export const AppRoute = defineRouteUnion(routeCases);

export type AppRoute = typeof AppRoute.Type;

export const PageRegistry = entriesToRecord<PagesByTag>(
  pages.map(entry => [entry.tag, entry]),
);

export const pageForRoute = (route: AppRoute): PageEntry =>
  PageRegistry[route._tag];

export const pageMetadata = (route: AppRoute): PageMetadata =>
  mergeMetadata(pageForRoute(route).metadata);

const allMetadata: ReadonlyArray<PageMetadata> = Object.values(
  PageRegistry,
).map(page => mergeMetadata(page.metadata));

export const metadataForTitle = (title: string): PageMetadata | undefined =>
  allMetadata.find(metadata => metadata.title === title);

type ParsedPage = Extract<
  PageEntry,
  { createRouter: (...args: never[]) => unknown }
>;

const parsedPages = pages.filter(
  (entry): entry is ParsedPage => entry.createRouter !== undefined,
);

const routeParser = Route.oneOf(
  ...parsedPages.map(entry => entry.createRouter(AppRoute)),
);

export const urlToAppRoute = Route.parseUrlWithFallback(
  routeParser,
  AppRoute.NotFound,
);
