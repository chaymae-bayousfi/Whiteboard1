import { prisma } from '@/config/prisma';
import { signAccessToken, signRefreshToken, hashPassword, verifyPassword } from '@/utils/auth';
import { config } from '@/config/env';
import { logger } from '@/config/logger';
import { randomUUID } from 'crypto';

export interface AuthResult {
  user: { id: string; email: string; name: string; avatarColor: string };
  accessToken: string;
  refreshToken: string;
}

async function issueTokens(user: { id: string; email: string; name: string }): Promise<{ accessToken: string; refreshToken: string; record: string }> {
  const accessToken = await signAccessToken({ sub: user.id, email: user.email, name: user.name });
  const refreshToken = await signRefreshToken({ sub: user.id, email: user.email, name: user.name });

  const tokenRecord = await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + config.jwt.refreshExpiresMs),
    },
  });

  return { accessToken, refreshToken, record: tokenRecord.id };
}

export async function registerUser(email: string, name: string, password: string): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw { statusCode: 409, message: 'Email already registered' };
  }

  const passwordHash = await hashPassword(password);
  const colors = ['#f472b6', '#c084fc', '#fb7185', '#fbbf24', '#34d399', '#60a5fa', '#f87171', '#a78bfa'];
  const avatarColor = colors[Math.floor(Math.random() * colors.length)];

  const user = await prisma.user.create({
    data: { email, name, passwordHash, avatarColor },
  });

  const { accessToken, refreshToken } = await issueTokens(user);
  return {
    user: { id: user.id, email: user.email, name: user.name, avatarColor: user.avatarColor },
    accessToken,
    refreshToken,
  };
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  const { accessToken, refreshToken } = await issueTokens(user);
  return {
    user: { id: user.id, email: user.email, name: user.name, avatarColor: user.avatarColor },
    accessToken,
    refreshToken,
  };
}

export async function refreshSession(refreshToken: string): Promise<AuthResult> {
  const record = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw { statusCode: 401, message: 'Invalid or expired refresh token' };
  }

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  const { accessToken, refreshToken: newRefreshToken } = await issueTokens(record.user);
  return {
    user: { id: record.user.id, email: record.user.email, name: record.user.name, avatarColor: record.user.avatarColor },
    accessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logoutSession(refreshToken: string): Promise<void> {
  const record = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (record && !record.revokedAt) {
    await prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
  }
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  logger.info({ userId }, 'Revoked all refresh tokens');
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, avatarColor: true, createdAt: true, updatedAt: true },
  });
  return user;
}
