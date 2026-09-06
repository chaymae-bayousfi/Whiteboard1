import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '@/middleware/authenticate';
import { getAppError } from '@/utils/errors';
import {
  getUserBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
  shareBoard,
  updateMemberPermission,
  removeMember,
  saveSnapshot,
  getSnapshots,
  getSnapshotData,
  getBoardShapes,
  canEditBoard,
} from '@/services/boardService';

const createBoardSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  publicPermission: z.enum(['view', 'edit']).optional(),
});

const updateBoardSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  isPublic: z.boolean().optional(),
  publicPermission: z.enum(['view', 'edit']).optional(),
});

const shareSchema = z.object({
  email: z.string().email(),
  permission: z.enum(['view', 'edit', 'admin']),
});

const updateMemberSchema = z.object({
  permission: z.enum(['view', 'edit', 'admin']),
});

const snapshotSchema = z.object({
  data: z.string().min(1).max(5 * 1024 * 1024).refine((value) => {
    try { JSON.parse(value); return true; } catch { return false; }
  }, 'Snapshot data must be valid JSON'),
});

export async function boardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/boards', async (request, reply) => {
    const boards = await getUserBoards(request.user!.sub);
    return reply.send({ boards });
  });

  app.post('/boards', async (request, reply) => {
    const parsed = createBoardSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    const board = await createBoard(
      request.user!.sub,
      parsed.data.title,
      parsed.data.description,
      parsed.data.isPublic,
      parsed.data.publicPermission,
    );
    return reply.code(201).send({ board });
  });

  app.get('/boards/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const board = await getBoardById(id, request.user!.sub);
    if (!board) return reply.code(404).send({ error: 'Board not found or access denied' });
    return reply.send({ board });
  });

  app.patch('/boards/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateBoardSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    try {
      const board = await updateBoard(id, request.user!.sub, parsed.data);
      return reply.send({ board });
    } catch (err: unknown) {
      const appError = getAppError(err, 'Update failed');
      return reply.code(appError.statusCode).send({ error: appError.message });
    }
  });

  app.delete('/boards/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await deleteBoard(id, request.user!.sub);
      return reply.send({ success: true });
    } catch (err: unknown) {
      const appError = getAppError(err, 'Delete failed');
      return reply.code(appError.statusCode).send({ error: appError.message });
    }
  });

  app.get('/boards/:id/shapes', async (request, reply) => {
    const { id } = request.params as { id: string };
    const board = await getBoardById(id, request.user!.sub);
    if (!board) return reply.code(404).send({ error: 'Board not found or access denied' });
    const shapes = await getBoardShapes(id);
    return reply.send({ shapes });
  });

  app.post('/boards/:id/share', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = shareSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    try {
      const result = await shareBoard(id, request.user!.sub, parsed.data.email, parsed.data.permission);
      return reply.send(result);
    } catch (err: unknown) {
      const appError = getAppError(err, 'Share failed');
      return reply.code(appError.statusCode).send({ error: appError.message });
    }
  });

  app.patch('/boards/:id/members/:userId', async (request, reply) => {
    const { id, userId } = request.params as { id: string; userId: string };
    const parsed = updateMemberSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    try {
      const member = await updateMemberPermission(id, request.user!.sub, userId, parsed.data.permission);
      return reply.send({ member });
    } catch (err: unknown) {
      const appError = getAppError(err, 'Update failed');
      return reply.code(appError.statusCode).send({ error: appError.message });
    }
  });

  app.delete('/boards/:id/members/:userId', async (request, reply) => {
    const { id, userId } = request.params as { id: string; userId: string };
    try {
      await removeMember(id, request.user!.sub, userId);
      return reply.send({ success: true });
    } catch (err: unknown) {
      const appError = getAppError(err, 'Remove failed');
      return reply.code(appError.statusCode).send({ error: appError.message });
    }
  });

  app.get('/boards/:id/snapshots', async (request, reply) => {
    const { id } = request.params as { id: string };
    const board = await getBoardById(id, request.user!.sub);
    if (!board) return reply.code(404).send({ error: 'Board not found or access denied' });
    const snapshots = await getSnapshots(id);
    return reply.send({ snapshots });
  });

  app.post('/boards/:id/snapshots', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = snapshotSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    const board = await getBoardById(id, request.user!.sub);
    if (!board) return reply.code(404).send({ error: 'Board not found or access denied' });
    if (!canEditBoard(board.permission as 'owner' | 'admin' | 'edit' | 'view')) {
      return reply.code(403).send({ error: 'Edit permission required' });
    }
    try {
      const snapshot = await saveSnapshot(id, request.user!.sub, parsed.data.data);
      return reply.code(201).send({ snapshot });
    } catch (err: unknown) {
      const appError = getAppError(err, 'Snapshot failed');
      return reply.code(appError.statusCode).send({ error: appError.message });
    }
  });

  app.get('/boards/:id/snapshots/:snapshotId', async (request, reply) => {
    const { id, snapshotId } = request.params as { id: string; snapshotId: string };
    const board = await getBoardById(id, request.user!.sub);
    if (!board) return reply.code(404).send({ error: 'Board not found or access denied' });
    const snapshots = await getSnapshots(id);
    const snap = snapshots.find((s) => s.id === snapshotId);
    if (!snap) return reply.code(404).send({ error: 'Snapshot not found' });
    const data = await getSnapshotData(snap.key);
    return reply.send({ data: data.toString() });
  });
}
