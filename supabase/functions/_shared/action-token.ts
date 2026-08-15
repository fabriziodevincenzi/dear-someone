export type LetterAction = 'stop' | 'report';

type LetterActionPayload = {
  v: 1;
  a: LetterAction;
  letterId: string;
  memberId: string;
  exp: number;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createLetterActionToken(input: {
  secret: string;
  action: LetterAction;
  letterId: string;
  memberId: string;
  expiresAt?: Date;
}) {
  const payload: LetterActionPayload = {
    v: 1,
    a: input.action,
    letterId: input.letterId,
    memberId: input.memberId,
    exp: Math.floor((input.expiresAt ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)).getTime() / 1000),
  };
  assertPayload(payload);

  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await sign(input.secret, encodedPayload);
  return `${encodedPayload}.${toBase64Url(signature)}`;
}

export async function verifyLetterActionToken(token: string, secret: string, now = new Date()) {
  if (!token || token.length > 1024) throw new Error('invalid_action_token');
  const [encodedPayload, encodedSignature, extra] = token.split('.');
  if (!encodedPayload || !encodedSignature || extra) throw new Error('invalid_action_token');

  let signature: Uint8Array;
  let payload: LetterActionPayload;
  try {
    signature = fromBase64Url(encodedSignature);
    payload = JSON.parse(decoder.decode(fromBase64Url(encodedPayload))) as LetterActionPayload;
  } catch {
    throw new Error('invalid_action_token');
  }

  const key = await importKey(secret, ['verify']);
  const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(domainSeparated(encodedPayload)));
  if (!valid) throw new Error('invalid_action_token');
  assertPayload(payload);
  if (payload.exp < Math.floor(now.getTime() / 1000)) throw new Error('expired_action_token');
  return payload;
}

function assertPayload(payload: LetterActionPayload) {
  if (
    payload?.v !== 1
    || (payload.a !== 'stop' && payload.a !== 'report')
    || !uuidPattern.test(payload.letterId)
    || !uuidPattern.test(payload.memberId)
    || !Number.isSafeInteger(payload.exp)
    || payload.exp <= 0
  ) {
    throw new Error('invalid_action_token');
  }
}

async function sign(secret: string, encodedPayload: string) {
  const key = await importKey(secret, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(domainSeparated(encodedPayload))));
}

function importKey(secret: string, usages: KeyUsage[]) {
  if (secret.length < 32) throw new Error('ALIAS_HMAC_SECRET must contain at least 32 characters');
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, usages);
}

function domainSeparated(encodedPayload: string) {
  return `one-reader-letter-action:v1:${encodedPayload}`;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('invalid_base64url');
  const padded = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
