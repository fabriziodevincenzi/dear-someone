export const siteLocales = ['en', 'it', 'es', 'fr', 'de', 'sv', 'da', 'no', 'uk', 'ja', 'pl', 'pt', 'nl'] as const;

export const defaultLocale: SiteLocale = 'en';
export const languagePoolMinimum = 21;

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

/**
 * English is always available. Other matching pools become available once
 * they reach the minimum and remain available after that first unlock.
 */
export function getUnlockedMatchingLanguages(
  memberCounts: Partial<Record<SiteLocale, number>> = {},
  previouslyUnlocked: SiteLocale[] = [],
) {
  const unlocked = new Set<SiteLocale>([defaultLocale, ...previouslyUnlocked]);

  for (const locale of siteLocales) {
    if ((memberCounts[locale] ?? 0) >= languagePoolMinimum) unlocked.add(locale);
  }

  return siteLocales.filter((locale) => unlocked.has(locale));
}
