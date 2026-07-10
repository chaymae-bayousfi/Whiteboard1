import { FastifyReply, FastifyRequest } from 'fastify';
import { verifyAccessToken, JwtPayload } from '@/utils/auth';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = header.slice(7);
  const payload = await verifyAccessToken(token);
  if (!payload) {
    reply.code(401).send({ error: 'Invalid or expired token' });
    return;
  }

  request.user = payload;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}
