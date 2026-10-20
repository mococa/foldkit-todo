import type { HtmlBuilder } from 'foldkit/html';

import type { Model } from '../../main';
import { SITE_NAME } from '../metadata';
import { definePage } from '../page';

export const NotFoundPage = definePage({
  metadata: {
    title: `Not Found | ${SITE_NAME}`,
    description: 'The page you are looking for does not exist.',
  },
  view: <Message>(model: Model, h: HtmlBuilder<Message>) => {
    const path = model.route._tag === 'NotFound' ? model.route.path : '';

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
