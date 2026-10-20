import { Schema } from 'effect';

import { definePage } from '../../lib/router';
import { SITE_NAME } from '../../site';

export const NotFoundPage = definePage({
  tag: 'NotFound',
  path: undefined,
  route: { path: Schema.String },
  metadata: {
    title: `Not Found | ${SITE_NAME}`,
    description: 'The page you are looking for does not exist.',
    noIndex: true,
  },
  view: (model, h) => {
    const path = model.route.path;

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
