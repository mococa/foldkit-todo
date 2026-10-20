import { Effect, Schema } from 'effect';

export const SITE_NAME = 'Foldkit Drawing Studio';
const DEFAULT_DESCRIPTION = 'A Foldkit drawing studio built with Effect.';

export const PageMetadata = Schema.Struct({
  title: Schema.String.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed(SITE_NAME)),
  ),
  description: Schema.String.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed(DEFAULT_DESCRIPTION)),
  ),
  image: Schema.optionalKey(Schema.String),
});

export type PageMetadata = typeof PageMetadata.Type;

export const PageMetadataOverrides = Schema.Struct({
  title: Schema.optionalKey(Schema.String),
  description: Schema.optionalKey(Schema.String),
  image: Schema.optionalKey(Schema.String),
});

export type PageMetadataOverrides = typeof PageMetadataOverrides.Type;

export const mergeMetadata = (overrides: PageMetadataOverrides): PageMetadata =>
  Schema.decodeUnknownSync(PageMetadata)(overrides);

export const DefaultMetadata: PageMetadata = mergeMetadata({});

export type HeadTag = Readonly<{
  attribute: 'name' | 'property';
  key: string;
  content: string | undefined;
}>;

export const headTags = (metadata: PageMetadata): ReadonlyArray<HeadTag> => [
  {
    attribute: 'property',
    key: 'og:site_name',
    content: SITE_NAME,
  },
  {
    attribute: 'property',
    key: 'og:title',
    content: metadata.title,
  },
  {
    attribute: 'name',
    key: 'twitter:title',
    content: metadata.title,
  },
  {
    attribute: 'name',
    key: 'description',
    content: metadata.description,
  },
  {
    attribute: 'property',
    key: 'og:description',
    content: metadata.description,
  },
  {
    attribute: 'name',
    key: 'twitter:description',
    content: metadata.description,
  },
  {
    attribute: 'property',
    key: 'og:image',
    content: metadata.image,
  },
  {
    attribute: 'name',
    key: 'twitter:image',
    content: metadata.image,
  },
  {
    attribute: 'name',
    key: 'twitter:card',
    content: metadata.image === undefined ? undefined : 'summary_large_image',
  },
  {
    attribute: 'property',
    key: 'og:type',
    content: 'website',
  },
];

const escapeAttributeValue = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

const renderHeadTag = (tag: HeadTag): string | undefined =>
  tag.content === undefined
    ? undefined
    : `<meta ${tag.attribute}="${tag.key}" content="${escapeAttributeValue(tag.content)}">`;

export const renderHeadTags = (metadata: PageMetadata): string =>
  headTags(metadata)
    .flatMap(tag => {
      const html = renderHeadTag(tag);
      return html === undefined ? [] : [html];
    })
    .join('\n');
