import type { HtmlBuilder } from 'foldkit/html';

import { definePage } from '../../lib/router';
import { SITE_NAME } from '../../site';
import { GoogleLogin } from './mounts/google';

export const LoginPage = definePage({
  tag: 'Login',
  path: 'login',
  metadata: {
    title: `Sign In | ${SITE_NAME}`,
    description: 'Sign in to Foldkit Drawing Studio to start drawing.',
  },
  view: (_model, h) =>
    h.div(
      [h.Class('grid min-h-svh md:grid-cols-2')],
      [leftPanel(h), rightPanel(h)],
    ),
});

/**
 * Google's mark, kept in Foldkit's SVG builder.
 *
 * @param h HtmlBuilder instance to create the SVG.
 */
function googleIcon<Message>(h: HtmlBuilder<Message>) {
  return h.svg(
    [
      h.ViewBox('0 0 24 24'),
      h.Class('absolute left-4 flex size-[18px] items-center'),
      h.AriaHidden(true),
    ],
    [
      h.path([
        h.Fill('#4285F4'),
        h.D(
          'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z',
        ),
      ]),
      h.path([
        h.Fill('#34A853'),
        h.D(
          'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z',
        ),
      ]),
      h.path([
        h.Fill('#FBBC05'),
        h.D(
          'M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z',
        ),
      ]),
      h.path([
        h.Fill('#EA4335'),
        h.D(
          'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z',
        ),
      ]),
    ],
  );
}

/**
 * Left panel of the sign-in page.
 * Renders the Google sign-in button and some text.
 *
 * @param h HtmlBuilder instance to create HTML elements.
 */
function leftPanel<Message>(h: HtmlBuilder<Message>) {
  return h.section(
    [h.Class('flex flex-col justify-center bg-background p-6 sm:p-10 lg:p-16')],
    [
      h.div(
        [h.Class('mx-auto w-full max-w-sm')],
        [
          h.div(
            [h.Class('mb-8')],
            [
              h.div(
                [h.Class('flex items-center gap-2')],
                [
                  h.div(
                    [
                      h.Class(
                        'flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground',
                      ),
                    ],
                    ['◆'],
                  ),
                  h.span(
                    [h.Class('text-lg font-semibold tracking-tight')],
                    ['FoldkitTodo'],
                  ),
                ],
              ),
            ],
          ),

          h.div(
            [h.Class('mb-6 space-y-1.5')],
            [
              h.h1(
                [h.Class('text-2xl font-semibold tracking-tight')],
                ['Welcome back'],
              ),
              h.p(
                [h.Class('text-sm text-muted-foreground')],
                ['Sign in to continue to your account.'],
              ),
            ],
          ),

          h.button(
            [
              // oxlint-disable-next-line typescript/consistent-type-assertions
              h.OnMount(GoogleLogin() as never),
              h.Class(
                'relative inline-flex h-11 w-full items-center justify-center rounded-md border border-[#dadce0] bg-white px-3 text-sm font-medium text-[#1f1f1f] transition-colors hover:bg-[#f8f9fa]',
              ),
            ],
            [googleIcon(h), 'Continue with Google'],
          ),

          h.p(
            [h.Class('mt-6 text-xs leading-relaxed text-muted-foreground')],
            [
              'By continuing, you agree to the ',
              h.a(
                [
                  h.Class('text-foreground underline underline-offset-4'),
                  h.Href('#'),
                ],
                ['Terms of Service'],
              ),
              ' and ',
              h.a(
                [
                  h.Class('text-foreground underline underline-offset-4'),
                  h.Href('#'),
                ],
                ['Privacy Policy'],
              ),
              '.',
            ],
          ),
        ],
      ),
    ],
  );
}

/**
 * Right panel of the sign-in page.
 * Renders a list of features and a background pattern.
 *
 * @param h HtmlBuilder instance to create HTML elements.
 * @returns An HTML aside element containing the right panel content.
 */
function rightPanel<Message>(h: HtmlBuilder<Message>) {
  return h.aside(
    [
      h.Class(
        'relative hidden flex-col justify-center overflow-hidden bg-zinc-900 p-10 text-white md:flex lg:p-16',
      ),
    ],
    [
      h.div([
        h.Class(
          'pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.18)_1px,transparent_0)] [background-size:22px_22px]',
        ),
      ]),

      h.div(
        [h.Class('relative max-w-md space-y-8')],
        [
          h.div(
            [h.Class('space-y-3')],
            [
              h.h2(
                [
                  h.Class(
                    'text-2xl font-semibold leading-tight tracking-tight',
                  ),
                ],
                ['Everything in one place'],
              ),
              h.p(
                [h.Class('text-sm leading-6 text-white/70')],
                [
                  'A simple, organized space to manage your work and stay up to date.',
                ],
              ),
            ],
          ),

          h.ul(
            [h.Class('space-y-4')],
            (
              [
                [
                  'layers',
                  'Organize your work',
                  'Keep important information together.',
                ],
                [
                  'users',
                  'Work together',
                  'Share updates and collaborate with others.',
                ],
                [
                  'chart',
                  'Track progress',
                  'See progress and review key details.',
                ],
                [
                  'settings',
                  'Stay in control',
                  'Manage your preferences in one place.',
                ],
              ] as const
            ).map(([_icon, title, description]) =>
              h.li(
                [h.Class('flex items-start gap-3')],
                [
                  h.div(
                    [
                      h.Class(
                        'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10',
                      ),
                    ],
                    ['◇'],
                  ),
                  h.div(
                    [],
                    [
                      h.p([h.Class('text-sm font-medium')], [title]),
                      h.p([h.Class('text-xs text-white/60')], [description]),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),

      h.p(
        [
          h.Class(
            'absolute bottom-10 left-10 text-xs text-white/50 lg:bottom-16 lg:left-16',
          ),
        ],
        ['© 2026 FoldkitTodo'],
      ),
    ],
  );
}
