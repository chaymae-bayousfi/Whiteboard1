import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { registerUser, loginUser, refreshSession, logoutSession, getUserById } from '@/services/authService';
import { authenticate } from '@/middleware/authenticate';
import { getAppError } from '@/utils/errors';

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  password: z.string().min(6).max(72),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    try {
      const result = await registerUser(parsed.data.email, parsed.data.name, parsed.data.password);
      return reply.code(201).send(result);
    } catch (err: unknown) {
      const appError = getAppError(err, 'Registration failed');
      return reply.code(appError.statusCode).send({ error: appError.message });
    }
  });

  app.post('/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    try {
      const result = await loginUser(parsed.data.email, parsed.data.password);
      return reply.send(result);
    } catch (err: unknown) {
      const appError = getAppError(err, 'Login failed');
      return reply.code(appError.statusCode).send({ error: appError.message });
    }
  });

  app.post('/auth/refresh', async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    try {
      const result = await refreshSession(parsed.data.refreshToken);
      return reply.send(result);
    } catch (err: unknown) {
      const appError = getAppError(err, 'Token refresh failed');
      return reply.code(appError.statusCode).send({ error: appError.message });
    }
  });

  app.post('/auth/logout', async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    try {
      await logoutSession(parsed.data.refreshToken);
      return reply.send({ success: true });
    } catch {
      return reply.send({ success: true });
    }
  });

  app.get('/users/me', { preHandler: authenticate }, async (request, reply) => {
    const user = await getUserById(request.user!.sub);
    if (!user) return reply.code(404).send({ error: 'User not found' });
    return reply.send(user);
  });
}
