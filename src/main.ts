import { Option } from 'effect';
import { Runtime } from 'foldkit';
import { type Document, type HtmlBuilder } from 'foldkit/html';

import { CheckSession, type Message } from './internal';
import { Model } from './model';
import { init as initTodo } from './page/todo/logic';
import { pageMetadata, urlToAppRoute, viewForRoute } from './route';

export { Message, update } from './internal';

// MODEL

export { Model } from './model';

// INIT

export const init: Runtime.RoutingApplicationInit<Model, Message> = url => ({
  commands: [CheckSession()],
  model: {
    route: urlToAppRoute(url),
    maybeSession: Option.none(),
    maybeLoginError: Option.none(),
    todo: initTodo,
  },
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
      [viewForRoute(model.route, h, model)],
    ),
  };
};
