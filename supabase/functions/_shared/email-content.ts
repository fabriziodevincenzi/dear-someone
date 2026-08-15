export const MAX_LETTER_CHARACTERS = 50_000;

export type ReceivedEmailContent = {
  text?: string | null;
  html?: string | null;
};

export type PreparedLetter = {
  text: string;
  truncated: boolean;
};

const replyBoundaryPatterns = [
  /^on .{3,240} wrote:\s*$/i,
  /^-{2,}\s*original message\s*-{2,}$/i,
  /^from:\s+.+$/i,
  /^_{5,}\s*$/,
];

export function normalizeEmailAddress(value: string) {
  const match = value.match(/<([^<>]+)>/);
  return (match?.[1] ?? value).trim().toLowerCase();
}

export function prepareLetterContent(content: ReceivedEmailContent): PreparedLetter {
  const source = content.text?.trim() || htmlToPlainText(content.html ?? '');
  const withoutQuotedHistory = stripQuotedHistory(source);
  const normalized = normalizeWhitespace(withoutQuotedHistory);

  if (!normalized) throw new Error('The email does not contain a letter body');

  if (normalized.length <= MAX_LETTER_CHARACTERS) {
    return { text: normalized, truncated: false };
  }

  return {
    text: normalized.slice(0, MAX_LETTER_CHARACTERS).trimEnd(),
    truncated: true,
  };
}

export function stripQuotedHistory(value: string) {
  const lines = value.replace(/\r\n?/g, '\n').split('\n');
  const kept: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '--' || trimmed === '-- ') break;
    if (/^sent from my (iphone|ipad|android)/i.test(trimmed)) break;
    if (trimmed.startsWith('>')) break;
    if (replyBoundaryPatterns.some((pattern) => pattern.test(trimmed))) break;
    kept.push(line);
  }

  return kept.join('\n');
}

export function htmlToPlainText(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(script|style|head|title)[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replace(/<blockquote[^>]*>[\s\S]*?<\/blockquote>/gi, '\n')
      .replace(/<(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, ''),
  );
}

export function isAutomatedMessage(headers: Record<string, string | string[] | undefined>, from: string) {
  const normalized = lowerCaseHeaders(headers);
  const autoSubmitted = normalized['auto-submitted'] ?? '';
  const precedence = normalized.precedence ?? '';
  const sender = normalizeEmailAddress(from);

  return (
    (autoSubmitted !== '' && autoSubmitted.toLowerCase() !== 'no') ||
    /^(bulk|junk|list)$/i.test(precedence) ||
    Boolean(normalized['x-autoreply'] || normalized['x-autorespond']) ||
    /(^|[._-])(mailer-daemon|postmaster|no-?reply)([._+-]|@)/i.test(sender)
  );
}

export function senderAuthenticationPassed(headers: Record<string, string | string[] | undefined>) {
  const authenticationResults = lowerCaseHeaders(headers)['authentication-results'] ?? '';
  return /\bdmarc=pass\b/i.test(authenticationResults) || /\bdkim=pass\b/i.test(authenticationResults);
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeWhitespace(value: string) {
  return value
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/ +\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function decodeHtmlEntities(value: string) {
  const named: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, token: string) => {
    if (token.startsWith('#x') || token.startsWith('#X')) {
      return safeCodePoint(Number.parseInt(token.slice(2), 16), entity);
    }
    if (token.startsWith('#')) {
      return safeCodePoint(Number.parseInt(token.slice(1), 10), entity);
    }
    return named[token.toLowerCase()] ?? entity;
  });
}

function safeCodePoint(value: number, fallback: string) {
  if (!Number.isFinite(value) || value < 0 || value > 0x10ffff) return fallback;
  try {
    return String.fromCodePoint(value);
  } catch {
    return fallback;
  }
}

function lowerCaseHeaders(headers: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key.toLowerCase(),
      Array.isArray(value) ? value.join(', ') : value ?? '',
    ]),
  );
}
