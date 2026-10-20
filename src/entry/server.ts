import { Effect } from 'effect';
import { Server } from 'foldkit/experimental';

import { init, view } from '../main';
import { mergeMetadata, renderHeadTags } from '../page/metadata';
import { metadataForTitle } from '../page/registry';

export const renderDocument: Server.DocumentRenderer = (
  application,
  assets,
) => {
  const metadata =
    metadataForTitle(application.title) ??
    mergeMetadata({
      title: application.title,
    });

  return Server.renderDocument(application, assets, {
    head: renderHeadTags(metadata),
  });
};

export const prerenderPaths: ReadonlyArray<string> = ['/', '/login'];

export const renderPage = (request: Request): Promise<Server.EntryResult> =>
  Effect.runPromise(
    Effect.gen(function* () {
      const renderedApplication = yield* Server.renderToString(
        { routing: {}, init, view },
        { url: request.url },
      );

      return Server.Rendered(renderedApplication);
    }),
  );
