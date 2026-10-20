import type { Html, HtmlBuilder } from 'foldkit/html';

import type { Model } from '../main';
import type { PageMetadataOverrides } from './metadata';

export type PageDefinition = Readonly<{
  metadata: PageMetadataOverrides;
  view: <Message>(model: Model, h: HtmlBuilder<Message>) => Html;
}>;

export const definePage = (page: PageDefinition): PageDefinition => page;
