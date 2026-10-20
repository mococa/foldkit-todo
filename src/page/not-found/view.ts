import { Schema } from 'effect';
import type { HtmlBuilder } from 'foldkit/html';

import { SITE_NAME } from '../metadata';
import { type PageModel, createPage } from '../page';

export const NotFoundPage = createPage({
  tag: 'NotFound',
  path: undefined,
  route: { path: Schema.String },
  metadata: {
    title: `Not Found | ${SITE_NAME}`,
    description: 'The page you are looking for does not exist.',
  },
  view: <Message>(model: PageModel, h: HtmlBuilder<Message>) => {
    const path = model.route.path ?? '';

    return h.section(
      [h.Class('grid gap-4')],
      [
        h.h1(
          [h.Id('page-title'), h.Class('text-4xl font-bold')],
          ['Not found'],
        ),
        h.p([], [`No statically generated page exists for ${path}.`]),
      ],
    );
  },
});
