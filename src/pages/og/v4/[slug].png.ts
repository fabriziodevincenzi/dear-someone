import type { APIRoute } from 'astro';
import { blogArticles } from '../../../lib/blog';
import { GET as renderSocialCard } from '../[slug].png';

export function getStaticPaths() {
  return blogArticles.map((article) => ({
    params: { slug: article.slug },
    props: { article },
  }));
}

export const GET: APIRoute = renderSocialCard;
