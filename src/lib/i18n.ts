export const siteLocales = ['en', 'it', 'es', 'fr', 'de', 'sv', 'da', 'no', 'uk', 'ja', 'pl', 'pt', 'nl'] as const;

export type SiteLocale = (typeof siteLocales)[number];

export const languageOptions: Array<[SiteLocale, string]> = [
  ['en', 'English'],
  ['it', 'Italian'],
  ['es', 'Spanish'],
  ['fr', 'French'],
  ['de', 'German'],
  ['sv', 'Swedish'],
  ['da', 'Danish'],
  ['no', 'Norwegian'],
  ['uk', 'Ukrainian'],
  ['ja', 'Japanese'],
  ['pl', 'Polish'],
  ['pt', 'Portuguese'],
  ['nl', 'Dutch'],
];

export const isSiteLocale = (value: string): value is SiteLocale =>
  siteLocales.includes(value as SiteLocale);
