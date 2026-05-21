import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const LEGACY_SALT = 'medcore-demo-salt-v1';
const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK = 8;
const SCRYPT_PARA = 1;

function legacyHash(pin: string): string {
  return createHash('sha256').update(`${LEGACY_SALT}:${pin}`).digest('hex');
}

function scryptHash(pin: string, salt: Buffer): Buffer {
  return scryptSync(pin, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK,
    p: SCRYPT_PARA,
  });
}

export function hashPin(pin: string): string {
  const salt = randomBytes(16);
  const derived = scryptHash(pin, salt);
  return `scrypt$${salt.toString('base64')}$${derived.toString('base64')}`;
}

export function verifyPin(pin: string, hash: string | null | undefined): boolean {
  if (!hash) return false;
  if (hash.startsWith('scrypt$')) {
    const [, saltB64, derivedB64] = hash.split('$');
    if (!saltB64 || !derivedB64) return false;
    try {
      const salt = Buffer.from(saltB64, 'base64');
      const stored = Buffer.from(derivedB64, 'base64');
      const derived = scryptHash(pin, salt);
      if (derived.length !== stored.length) return false;
      return timingSafeEqual(derived, stored);
    } catch {
      return false;
    }
  }
  const a = Buffer.from(legacyHash(pin), 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isLegacyHash(hash: string | null | undefined): boolean {
  if (!hash) return false;
  return !hash.startsWith('scrypt$');
}

export function pinNeedsRotation(rotatedAt: number | null | undefined): boolean {
  if (!rotatedAt) return true;
  const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
  return Date.now() - rotatedAt > THIRTY_DAYS;
}
