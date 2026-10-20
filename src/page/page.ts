import { Schema, pipe } from 'effect';
import { Route } from 'foldkit';
import type { Html, HtmlBuilder } from 'foldkit/html';
import {
  type Biparser,
  type Router,
  int,
  literal,
  root,
  schemaSegment,
  slash,
  string,
} from 'foldkit/route';
import type { CallableTaggedStruct } from 'foldkit/schema';

import type { PageMetadataOverrides } from './metadata';

export type PageModel = Readonly<{
  route: Readonly<{ _tag: string; path?: string }>;
}>;

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

type PageFields<Tag extends string> = Readonly<{
  tag: Tag;
  metadata: PageMetadataOverrides;
  view: <Message>(model: PageModel, h: HtmlBuilder<Message>) => Html;
}>;

type PageRouter<
  Tag extends string,
  Fields extends Schema.Struct.Fields,
> = (routes: {
  [K in Tag]: CallableTaggedStruct<K, Fields>;
}) => Router<ReturnType<CallableTaggedStruct<Tag, Fields>>>;

type PageOutput<
  Tag extends string,
  Fields extends Schema.Struct.Fields,
  Path extends string | undefined,
> = PageFields<Tag> &
  Readonly<{
    path: Path;
    route: Fields;
    createRouter: Path extends undefined ? undefined : PageRouter<Tag, Fields>;
  }>;

type PageInput<
  Tag extends string,
  Fields extends Schema.Struct.Fields,
  Path extends string | undefined,
> = PageFields<Tag> &
  Readonly<{ path: Path; route?: Fields }> &
  (Path extends undefined
    ? { createRouter?: never }
    : CanAutoRouter<Path, Fields> extends true
      ? { createRouter?: never }
      : { createRouter: PageRouter<Tag, Fields> });

const asSegmentCodec = (
  schema: Schema.Constraint,
): Schema.Codec<unknown, string> =>
  // oxlint-disable-next-line typescript/consistent-type-assertions
  schema as Schema.Codec<unknown, string>;

const asFields = <Fields>(data: Record<string, unknown>): Fields =>
  // oxlint-disable-next-line typescript/consistent-type-assertions
  data as Fields;

const asParser = (parser: Biparser<{}>): Biparser<Record<string, unknown>> =>
  // oxlint-disable-next-line typescript/consistent-type-assertions
  parser as Biparser<Record<string, unknown>>;

const segmentParser = (
  route: Schema.Struct.Fields,
  name: string,
): Biparser<Record<string, unknown>> => {
  const schema = route[name];

  if (schema === undefined) {
    throw new Error(`Missing route schema for path param "${name}"`);
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

export const definePage = <
  const Tag extends string,
  const Fields extends Schema.Struct.Fields = {},
  const Path extends string | undefined = string | undefined,
>(
  page: PageInput<Tag, Fields, Path>,
): PageOutput<Tag, Fields, Path> => {
  const path = page.path;
  const route = page.route ?? {};
  const autoRouter =
    path === undefined
      ? undefined
      : (routes: { [K in Tag]: CallableTaggedStruct<K, Fields> }) =>
          pipe(
            buildPathParser(path, route),
            Route.mapTo({
              make: (data: Record<string, unknown>) =>
                routes[page.tag](asFields<Fields>(data)),
            }),
          );

  const createRouter =
    'createRouter' in page && page.createRouter !== undefined
      ? page.createRouter
      : autoRouter;

  // oxlint-disable-next-line typescript/consistent-type-assertions
  return {
    tag: page.tag,
    path: page.path,
    route,
    metadata: page.metadata,
    view: page.view,
    createRouter,
  } as PageOutput<Tag, Fields, Path>;
};
