import { Schema } from 'effect';
import { Runtime } from 'foldkit';
import { type Document, type Html, type HtmlBuilder } from 'foldkit/html';

import type { Message } from './internal';
import { pageForRoute, pageMetadata } from './page';
import { AppRoute, urlToAppRoute } from './route';

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

const layout = (model: Model, h: HtmlBuilder<Message>): Html =>
  pageForRoute(model.route).view(model, h);

export const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: pageMetadata(model.route).title,
  body: h.main([h.Class('flex min-h-screen flex-col')], [layout(model, h)]),
});
