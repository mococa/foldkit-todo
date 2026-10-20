import type { HtmlBuilder } from 'foldkit/html';

import { definePage } from '../../lib/router';
import { SITE_NAME } from '../../site';

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
                    ['Workspace'],
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
              h.Class(
                'relative inline-flex h-11 w-full items-center justify-center rounded-md border border-[#dadce0] bg-white px-3 text-sm font-medium text-[#1f1f1f] transition-colors hover:bg-[#f8f9fa]',
              ),
            ],
            [
              h.span([h.Class('absolute left-4 flex items-center')], ['G']),
              'Continue with Google',
            ],
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
        ['© 2026 Workspace'],
      ),
    ],
  );
}
