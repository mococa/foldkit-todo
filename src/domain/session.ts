import { Schema } from 'effect';

export const Session = Schema.Struct({
  sessionId: Schema.String,
  userId: Schema.String,
  email: Schema.String,
  name: Schema.Option(Schema.String),
});

export type Session = typeof Session.Type;
