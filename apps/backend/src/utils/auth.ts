import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { config } from '@/config/env';
import { logger } from '@/config/logger';

const encoder = new TextEncoder();

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  type: 'access' | 'refresh';
}

export async function signAccessToken(payload: Omit<JwtPayload, 'type'>): Promise<string> {
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(config.jwt.accessExpires)
    .sign(encoder.encode(config.jwt.accessSecret));
}

export async function signRefreshToken(payload: Omit<JwtPayload, 'type'>): Promise<string> {
  return new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(config.jwt.refreshExpires)
    .sign(encoder.encode(config.jwt.refreshSecret));
}

export async function verifyAccessToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encoder.encode(config.jwt.accessSecret));
    if (payload.type !== 'access' || typeof payload.sub !== 'string') return null;
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encoder.encode(config.jwt.refreshSecret));
    if (payload.type !== 'refresh' || typeof payload.sub !== 'string') return null;
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export function decodeTokenUnsafely(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return payload as JwtPayload;
  } catch (err) {
    logger.warn({ err }, 'Failed to decode token');
    return null;
  }
}
