import type { APIRoute } from 'astro';
import { blogArticles } from '../../lib/blog';

export const GET: APIRoute = ({ site }) => {
  const baseUrl = (site ?? new URL('https://onereader.co')).toString().replace(/\/$/, '');
  const items = blogArticles
    .map(
      (article) => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <description><![CDATA[${article.description}]]></description>
      <link>${baseUrl}/journal/${article.slug}/</link>
      <guid>${baseUrl}/journal/${article.slug}/</guid>
      <pubDate>${new Date(`${article.publishedAt}T00:00:00Z`).toUTCString()}</pubDate>
    </item>`,
    )
    .join('');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>One Reader Journal</title>
    <description>Notes on writing to strangers, paying attention, and finding a way to begin.</description>
    <link>${baseUrl}/journal/</link>
    <language>en</language>${items}
  </channel>
</rss>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
