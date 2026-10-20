import { definePage } from '../../lib/router';
import { Message } from '../../message';
import { SITE_NAME } from '../../site';

export const TodoPage = definePage({
  tag: 'Todo',
  path: '',
  metadata: {
    title: `Todo | ${SITE_NAME}`,
    description: 'Manage your drawing studio tasks.',
  },
  view: (_model, h) =>
    h.div(
      [h.Class('flex min-h-svh flex-col items-center justify-center gap-4')],
      [
        h.h1([h.Class('text-3xl font-bold')], ['Todo']),
        h.p(
          [h.Class('text-muted-foreground')],
          ['Todo functionality is coming next.'],
        ),
        h.button(
          [
            // oxlint-disable-next-line typescript/consistent-type-assertions
            h.OnClick(Message.ClickedLogout() as never),
            h.Class(
              'rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100',
            ),
          ],
          ['Sign out'],
        ),
      ],
    ),
});
