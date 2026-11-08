import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

/**
 * Băm mật khẩu an toàn sử dụng thuật toán scrypt tích hợp sẵn của Node.js
 */
export function hashPassword(plainPassword: string): string {
  const salt = randomBytes(SALT_LENGTH).toString('hex');
  const derivedKey = scryptSync(plainPassword, salt, KEY_LENGTH).toString(
    'hex',
  );
  return `${salt}:${derivedKey}`;
}

/**
 * Kiểm tra mật khẩu chống tấn công timing-attack
 */
export function verifyPassword(
  plainPassword: string,
  storedHash: string,
): boolean {
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) {
    return false;
  }

  const keyBuffer = Buffer.from(keyHex, 'hex');
  const derivedBuffer = scryptSync(plainPassword, salt, KEY_LENGTH);

  if (keyBuffer.length !== derivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(keyBuffer, derivedBuffer);
}
