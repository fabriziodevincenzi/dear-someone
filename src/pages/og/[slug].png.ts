import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { blogArticles } from '../../lib/blog';

export function getStaticPaths() {
  return blogArticles.map((article) => ({
    params: { slug: article.slug },
    props: { article },
  }));
}

const escapeXml = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

const wrap = (value: string, maxCharacters: number) => {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxCharacters && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines;
};

export const GET: APIRoute = async ({ props }) => {
  const article = props.article;
  const titleLines = wrap(article.title, 28);
  const subtitleLines = wrap(article.subtitle, 58);
  const titleMarkup = titleLines
    .map((line, index) => `<text x="96" y="${245 + index * 78}" class="title">${escapeXml(line)}</text>`)
    .join('');
  const subtitleMarkup = subtitleLines
    .map((line, index) => `<text x="100" y="${430 + index * 32}" class="subtitle">${escapeXml(line)}</text>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f5f0e7"/>
  <path d="M96 126H1104" stroke="#cec5b7" stroke-width="2"/>
  <text x="96" y="82" class="brand">One Reader</text>
  <text x="96" y="188" class="eyebrow">JOURNAL</text>
  ${titleMarkup}
  ${subtitleMarkup}
  <path d="M96 548H1104" stroke="#cec5b7" stroke-width="2"/>
  <text x="96" y="586" class="footer">onereader.co/journal</text>
  <style>
    .brand { fill:#211f1b; font: 400 34px Georgia, serif; letter-spacing:-1px; }
    .eyebrow { fill:#9b5943; font: 650 15px Inter, Arial, sans-serif; letter-spacing:3px; }
    .title { fill:#211f1b; font: 400 62px Georgia, serif; letter-spacing:-2px; }
    .subtitle { fill:#6c665d; font: 400 23px Inter, Arial, sans-serif; }
    .footer { fill:#6c665d; font: 400 16px Inter, Arial, sans-serif; letter-spacing:1px; }
  </style>
</svg>`;

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
