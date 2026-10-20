import { Schema } from 'effect';

import { Session } from './domain/session';
import { Model as TodoModel } from './page/todo/logic/model';
import { AppRoute } from './route';

export const Model = Schema.Struct({
  route: AppRoute,
  maybeSession: Schema.Option(Session),
  maybeLoginError: Schema.Option(Schema.String),
  todo: TodoModel,
});

export type Model = typeof Model.Type;
