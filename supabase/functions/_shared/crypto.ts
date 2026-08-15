export type EncryptedLetter = {
  ciphertext: string;
  iv: string;
  wrappedDek: string;
  keyVersion: number;
};

const encoder = new TextEncoder();

export async function encryptLetter(text: string, encodedKek: string, keyVersion = 1): Promise<EncryptedLetter> {
  const kekBytes = fromBase64(encodedKek);
  if (kekBytes.byteLength !== 32) {
    throw new Error('LETTER_CONTENT_KEK must contain exactly 32 bytes encoded as base64');
  }

  const kek = await crypto.subtle.importKey('raw', kekBytes, 'AES-KW', false, ['wrapKey']);
  const dek = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, dek, encoder.encode(text));
  const wrappedDek = await crypto.subtle.wrapKey('raw', dek, kek, 'AES-KW');

  return {
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    iv: toBase64(iv),
    wrappedDek: toBase64(new Uint8Array(wrappedDek)),
    keyVersion,
  };
}

export async function decryptLetter(encrypted: EncryptedLetter, encodedKek: string) {
  const kekBytes = fromBase64(encodedKek);
  if (kekBytes.byteLength !== 32) {
    throw new Error('LETTER_CONTENT_KEK must contain exactly 32 bytes encoded as base64');
  }
  const kek = await crypto.subtle.importKey('raw', kekBytes, 'AES-KW', false, ['unwrapKey']);
  const dek = await crypto.subtle.unwrapKey(
    'raw',
    fromBase64(encrypted.wrappedDek),
    kek,
    'AES-KW',
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(encrypted.iv) },
    dek,
    fromBase64(encrypted.ciphertext),
  );
  return new TextDecoder().decode(plaintext);
}

export async function deriveAliasToken(secret: string, correspondenceId: string, permittedSenderId: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`v1:${correspondenceId}:${permittedSenderId}`),
  );
  return toBase64Url(new Uint8Array(signature).slice(0, 18));
}

export async function hashAliasToken(token: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function toBase64(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toBase64Url(bytes: Uint8Array) {
  return toBase64(bytes).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}
