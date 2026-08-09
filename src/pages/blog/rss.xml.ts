import type { APIRoute } from 'astro';
import { blogArticles } from '../../lib/blog';

export const GET: APIRoute = ({ site }) => {
  const baseUrl = (site ?? new URL('https://dearsomeone.net')).toString().replace(/\/$/, '');
  const items = blogArticles
    .map(
      (article) => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <description><![CDATA[${article.description}]]></description>
      <link>${baseUrl}/blog/${article.slug}/</link>
      <guid>${baseUrl}/blog/${article.slug}/</guid>
      <pubDate>${new Date(`${article.publishedAt}T00:00:00Z`).toUTCString()}</pubDate>
    </item>`,
    )
    .join('');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Dear Someone Journal</title>
    <description>Notes on correspondence, attention, and making room for a human email.</description>
    <link>${baseUrl}/blog/</link>
    <language>en</language>${items}
  </channel>
</rss>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
