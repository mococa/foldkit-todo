import { Schema } from 'effect';
import type { Document, HtmlBuilder } from 'foldkit/html';
import { defineMessageUnion } from 'foldkit/message';

import { type PageDefinition, defineRouter } from './router';

export const HomePage: PageDefinition<'Home', {}, 'home'> = {
  tag: 'Home',
  path: 'home',
  metadata: { title: 'Home' },
  view: (_model, h) => h.p([], ['Home page']),
};

export const UserPage: PageDefinition<
  'User',
  { id: typeof Schema.Number },
  'users/:id'
> = {
  tag: 'User',
  path: 'users/:id',
  route: { id: Schema.Number },
  metadata: { title: 'User' },
  view: (model, h) => h.p([], [`User ${model.route.id}`]),
};

export const PostPage: PageDefinition<
  'Post',
  { userId: typeof Schema.Number; postId: typeof Schema.Number },
  'users/:userId/posts/:postId'
> = {
  tag: 'Post',
  path: 'users/:userId/posts/:postId',
  route: { userId: Schema.Number, postId: Schema.Number },
  metadata: { title: 'Post' },
  view: (model, h) =>
    h.p([], [`Post ${model.route.userId}/${model.route.postId}`]),
};

export const FilePage: PageDefinition<
  'File',
  { userId: typeof Schema.Number; fileName: typeof Schema.String },
  'users/:userId/files/:fileName'
> = {
  tag: 'File',
  path: 'users/:userId/files/:fileName',
  route: { userId: Schema.Number, fileName: Schema.String },
  metadata: { title: 'File' },
  view: (model, h) =>
    h.p([], [`File ${model.route.fileName} of ${model.route.userId}`]),
};

export const NotFoundPage: PageDefinition<
  'NotFound',
  { path: typeof Schema.String },
  undefined
> = {
  tag: 'NotFound',
  path: undefined,
  route: { path: Schema.String },
  metadata: { title: 'Not Found', noIndex: true },
  view: (_model, h) => h.p([], ['Not found page']),
};

export const routes = defineRouter(
  {
    siteName: 'Router Library',
    fallbackTag: 'NotFound',
    defaultMetadata: { description: 'Default description' },
  },
  [HomePage, UserPage, PostPage, FilePage, NotFoundPage],
);

export const Model = Schema.Struct({ route: routes.AppRoute });

export type Model = typeof Model.Type;

export const Message = defineMessageUnion({
  ChangedRoute: { route: routes.AppRoute },
});

export type Message = typeof Message.Type;

export const init = (): Model => ({ route: routes.AppRoute.Home() });

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    ChangedRoute: ({ route }) => ({ model: { route } }),
  });

export const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: routes.pageMetadata(model.route).title,
  body: h.main([h.Class('p-4')], [routes.viewForRoute(model.route, h, model)]),
});
