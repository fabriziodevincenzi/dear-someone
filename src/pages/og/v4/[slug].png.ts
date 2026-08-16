import type { APIRoute } from 'astro';
import { getJournalEntries, getJournalSlug } from '../../../lib/journal';
import { GET as renderSocialCard } from '../[slug].png';

export async function getStaticPaths() {
  const entries = await getJournalEntries();
  const uniqueEntries = [...new Map(entries.map((entry) => [getJournalSlug(entry), entry])).values()];
  return uniqueEntries.map((entry) => ({
    params: { slug: getJournalSlug(entry) },
    props: { entry },
  }));
}

export const GET: APIRoute = renderSocialCard;
