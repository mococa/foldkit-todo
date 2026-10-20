import type { AppRoute } from '../route';
import { LoginPage } from './login';
import { type PageMetadata, mergeMetadata } from './metadata';
import { NotFoundPage } from './not-found';
import type { PageDefinition } from './page';

export const PageRegistry = {
  Login: LoginPage,
  NotFound: NotFoundPage,
} satisfies { readonly [Tag in AppRoute['_tag']]: PageDefinition };

export const pageForRoute = (route: AppRoute): PageDefinition =>
  PageRegistry[route._tag];

export const pageMetadata = (route: AppRoute): PageMetadata =>
  mergeMetadata(pageForRoute(route).metadata);

const allMetadata: ReadonlyArray<PageMetadata> = Object.values(
  PageRegistry,
).map(page => mergeMetadata(page.metadata));

export const metadataForTitle = (title: string): PageMetadata | undefined =>
  allMetadata.find(metadata => metadata.title === title);
