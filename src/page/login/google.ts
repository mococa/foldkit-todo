import { Effect, Option, Queue, Stream } from 'effect';
import { Mount } from 'foldkit';

import {
  OAuthCancelledError,
  PopupBlockedError,
  basebox,
  sessionStore,
} from '../../basebox';
import type { Session } from '../../domain/session';
import { Message } from '../../message';

type GoogleLoginMessage =
  | typeof Message.SucceededGoogleLogin.Type
  | typeof Message.FailedGoogleLogin.Type;

export const GoogleLogin = Mount.defineStream('GoogleLogin', {
  messages: [Message.SucceededGoogleLogin, Message.FailedGoogleLogin],
  execute: ({ element }) =>
    Stream.callback<GoogleLoginMessage>(queue =>
      Effect.gen(function* () {
        const bb = basebox;

        if (bb === undefined) {
          yield* Effect.sync(() => {
            window.alert(
              'Set VITE_BASEBOX_PUBLIC_KEY to enable Google sign-in.',
            );
          });

          return yield* Effect.never;
        }

        const emitSuccess = (session: Session) => {
          Queue.offerUnsafe(queue, Message.SucceededGoogleLogin({ session }));
        };

        const emitFailure = (reason: string) => {
          Queue.offerUnsafe(queue, Message.FailedGoogleLogin({ reason }));
        };

        const checkExistingSession = Effect.tryPromise({
          try: async () => {
            const sessionId = await sessionStore.get();

            if (sessionId === null) {
              return;
            }

            const client = bb.client({ sessionId });
            const { error } = await client.auth.check();

            if (error) {
              await client.auth.logout();
              return;
            }

            const { data } = await client.user.profile();

            if (
              data === undefined ||
              data.user === undefined ||
              data.profile === undefined
            ) {
              return;
            }

            emitSuccess({
              sessionId,
              userId: data.profile.userId,
              email: data.user.email,
              name: Option.fromNullishOr(data.profile.name),
            });
          },
          catch: error => error,
        }).pipe(Effect.catch(() => Effect.void));

        const handler = () => {
          bb.public()
            .auth.oauth2.initiate('google')
            .then(result => {
              emitSuccess({
                sessionId: result.sessionId,
                userId: result.profile.userId,
                email: result.user.email,
                name: Option.fromNullishOr(result.profile.name),
              });
            })
            .catch((error: unknown) => {
              if (error instanceof OAuthCancelledError) {
                return;
              }

              if (error instanceof PopupBlockedError) {
                window.alert('Please allow popups for this site.');
              } else if (error instanceof Error) {
                window.alert(error.message);
              }

              emitFailure(
                error instanceof Error
                  ? error.message
                  : 'Google sign-in failed',
              );
            });
        };

        yield* Effect.acquireRelease(
          Effect.sync(() => {
            element.addEventListener('click', handler);
            return handler;
          }),
          handler =>
            Effect.sync(() => element.removeEventListener('click', handler)),
        );

        yield* checkExistingSession;

        return yield* Effect.never;
      }),
    ),
});
