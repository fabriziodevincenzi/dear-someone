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

const balanceTitle = (value: string, maxCharacters: number) => {
  const words = value.split(/\s+/);
  if (words.length < 4) return wrap(value, maxCharacters);

  let best: string[] | undefined;
  let bestDifference = Number.POSITIVE_INFINITY;
  for (let split = 2; split < words.length - 1; split += 1) {
    const lines = [words.slice(0, split).join(' '), words.slice(split).join(' ')];
    if (lines.some((line) => line.length > maxCharacters)) continue;
    const difference = Math.abs(lines[0].length - lines[1].length);
    if (difference < bestDifference) {
      best = lines;
      bestDifference = difference;
    }
  }

  return best ?? wrap(value, maxCharacters);
};

const limitLines = (value: string, maxCharacters: number, maxLines: number) => {
  const lines = wrap(value, maxCharacters);
  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  visible[maxLines - 1] = `${visible[maxLines - 1].replace(/[.,;:!?]+$/, '')}…`;
  return visible;
};

export const GET: APIRoute = async ({ props }) => {
  const article = props.article;
  const titleLines = balanceTitle(article.title, 28);
  const titleFontSize = titleLines.length > 2 ? 64 : 80;
  const titleLineHeight = Math.round(titleFontSize * 1.08);
  const subtitleLines = article.subtitle ? limitLines(article.subtitle, 58, 2) : [];
  const subtitleStart = 224 + titleLines.length * titleLineHeight + 42;
  const titleMarkup = titleLines
    .map((line, index) => `<text x="96" y="${224 + index * titleLineHeight}" class="title">${escapeXml(line)}</text>`)
    .join('');
  const subtitleMarkup = subtitleLines
    .map((line, index) => `<text x="100" y="${subtitleStart + index * 42}" class="subtitle">${escapeXml(line)}</text>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f3eee4"/>
  <path d="M96 126H1104" stroke="#d4ccbb" stroke-width="1"/>
  <text x="96" y="82" class="brand">One Reader</text>
  <text x="364" y="82" class="separator">·</text>
  <text x="382" y="82" class="section">JOURNAL</text>
  ${titleMarkup}
  ${subtitleMarkup}
  <path d="M96 558H1104" stroke="#d4ccbb" stroke-width="1"/>
  <text x="96" y="598" class="footer">onereader.co/journal</text>
  <style>
    .brand { fill:#1c1a16; font: 600 32px Georgia, serif; letter-spacing:-1px; }
    .separator { fill:#8a8172; font: 400 25px Georgia, serif; }
    .section { fill:#b2523a; font: 500 16px Inter, Arial, sans-serif; letter-spacing:1.28px; }
    .title { fill:#1c1a16; font: 600 ${titleFontSize}px Georgia, serif; letter-spacing:-2.5px; }
    .subtitle { fill:#8a8172; font: 400 29px Inter, Arial, sans-serif; }
    .footer { fill:#8a8172; font: 400 15px Inter, Arial, sans-serif; letter-spacing:0; }
  </style>
</svg>`;

  const png = await sharp(Buffer.from(svg))
    .flatten({ background: '#f3eee4' })
    .png()
    .toBuffer();
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
