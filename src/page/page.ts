import { type Schema, pipe } from 'effect';
import { Route } from 'foldkit';
import type { Html, HtmlBuilder } from 'foldkit/html';
import { type Router, literal } from 'foldkit/route';
import type { CallableTaggedStruct } from 'foldkit/schema';

import type { PageMetadataOverrides } from './metadata';

export type PageModel = Readonly<{
  route: Readonly<{ _tag: string; path?: string }>;
}>;

type PageFields<Tag extends string> = Readonly<{
  tag: Tag;
  metadata: PageMetadataOverrides;
  view: <Message>(model: PageModel, h: HtmlBuilder<Message>) => Html;
}>;

type PageOutput<
  Tag extends string,
  Fields extends Schema.Struct.Fields,
  Path extends string | undefined,
  CreateRouter,
> = PageFields<Tag> &
  Readonly<{
    path: Path;
    route: Fields;
    createRouter: Path extends undefined
      ? undefined
      : keyof Fields extends never
        ? AutoRouter<Tag>
        : CreateRouter;
  }>;

type PageInput<
  Tag extends string,
  Fields extends Schema.Struct.Fields,
  Path extends string | undefined,
  CreateRouter,
> = PageFields<Tag> &
  Readonly<{ path: Path; route?: Fields }> &
  (keyof Fields extends never
    ? { createRouter?: never }
    : Path extends undefined
      ? { createRouter?: never }
      : { createRouter: CreateRouter });

type AutoRouter<Tag extends string> = (routes: {
  [K in Tag]: CallableTaggedStruct<K, {}>;
}) => Router<ReturnType<CallableTaggedStruct<Tag, {}>>>;

export const createPage = <
  const Tag extends string,
  const Fields extends Schema.Struct.Fields = {},
  const Path extends string | undefined = string | undefined,
  CreateRouter = undefined,
>(
  page: PageInput<Tag, Fields, Path, CreateRouter>,
): PageOutput<Tag, Fields, Path, CreateRouter> => {
  const path = page.path;
  const autoRouter =
    path === undefined
      ? undefined
      : (routes: { [K in Tag]: CallableTaggedStruct<K, {}> }) =>
          pipe(literal(path), Route.mapTo({ make: () => routes[page.tag]() }));

  const createRouter =
    'createRouter' in page && page.createRouter !== undefined
      ? page.createRouter
      : autoRouter;

  // oxlint-disable-next-line typescript/consistent-type-assertions
  return {
    tag: page.tag,
    path: page.path,
    route: page.route ?? {},
    metadata: page.metadata,
    view: page.view,
    createRouter,
  } as PageOutput<Tag, Fields, Path, CreateRouter>;
};
