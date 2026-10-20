import { Schema, pipe } from "effect";
import { Route } from "foldkit";
import { defineRouteUnion, literal } from "foldkit/route";

export const AppRoute = defineRouteUnion({
    Login: {},
    NotFound: { path: Schema.String },
});

export type AppRoute = typeof AppRoute.Type;

const definitions = [["login", AppRoute.Login]] as const;

const routes = definitions.map(([path, route]) =>
    pipe(literal(path), Route.mapTo(route)),
);

const parser = Route.oneOf(...routes);

export const urlToAppRoute = Route.parseUrlWithFallback(
    parser,
    AppRoute.NotFound,
);
