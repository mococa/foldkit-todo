import { Schema } from 'effect';
import { Runtime } from 'foldkit';
import { type Document, type HtmlBuilder } from 'foldkit/html';

import type { Message } from './internal';
import { AppRoute, pageMetadata, urlToAppRoute, viewForRoute } from './route';

export { Message, update } from './internal';

// MODEL

export const Model = Schema.Struct({
  route: AppRoute,
});

export type Model = typeof Model.Type;

// INIT

export const init: Runtime.RoutingApplicationInit<Model, Message> = url => ({
  model: { route: urlToAppRoute(url) },
});

// VIEW

export const view = (model: Model, h: HtmlBuilder<Message>): Document => {
  const metadata = pageMetadata(model.route);

  return {
    title: metadata.title,
    ...(metadata.canonical === undefined
      ? {}
      : { canonical: metadata.canonical }),
    ...(metadata.ogUrl === undefined ? {} : { ogUrl: metadata.ogUrl }),
    body: h.main(
      [h.Class('flex min-h-screen flex-col')],
      [viewForRoute(model.route, h)],
    ),
  };
};
