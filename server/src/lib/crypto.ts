import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { env } from './env.js';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;
const SCRYPT_SALT = 'medcore-encryption-salt-v1';

let cachedKey: Buffer | null = null;

function getKey(): Buffer | null {
  if (!env.DATABASE_ENCRYPTION_KEY) return null;
  if (cachedKey) return cachedKey;
  cachedKey = scryptSync(env.DATABASE_ENCRYPTION_KEY, SCRYPT_SALT, 32);
  return cachedKey;
}

export function encryptField(plaintext: string | null | undefined): string | null {
  if (plaintext == null) return null;
  const key = getKey();
  if (!key) return plaintext;
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

export function decryptField(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (!value.startsWith('enc:v1:')) return value;
  const key = getKey();
  if (!key) return value;
  try {
    const [, , ivB64, tagB64, dataB64] = value.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    if (tag.length !== TAG_LEN) return value;
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString('utf8');
  } catch {
    return value;
  }
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith('enc:v1:');
}
