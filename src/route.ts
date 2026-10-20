import { defineRouter } from './lib/router';
import { LoginPage } from './page/login';
import { NotFoundPage } from './page/not-found';
import { SITE_NAME } from './site';

export const routes = defineRouter(
  {
    siteName: SITE_NAME,
    fallbackTag: 'NotFound',
    defaultMetadata: {
      description: 'A Foldkit drawing studio built with Effect.',
    },
  },
  [LoginPage, NotFoundPage],
);

export const AppRoute = routes.AppRoute;

export type AppRoute = typeof AppRoute.Type;

export const urlToAppRoute = routes.urlToAppRoute;
export const pageForRoute = routes.pageForRoute;
export const pageMetadata = routes.pageMetadata;
export const metadataForTitle = routes.metadataForTitle;
export const viewForRoute = routes.viewForRoute;
/** Builds the URL path for a typed route value. */
export const href = routes.href;

/** Shapes Foldkit's routing config from app message callbacks. */
export const routing = routes.routing;
export const headTags = routes.headTags;
export const renderHeadTags = routes.renderHeadTags;
