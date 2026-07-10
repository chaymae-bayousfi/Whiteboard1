import { prisma } from '@/config/prisma';
import { uploadSnapshot, getSnapshot, deleteSnapshot } from '@/services/minio';
import { logger } from '@/config/logger';

export type Permission = 'owner' | 'admin' | 'edit' | 'view';

export async function getUserBoards(userId: string) {
  const [owned, member] = await Promise.all([
    prisma.board.findMany({
      where: { ownerId: userId },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarColor: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } } },
        _count: { select: { shapes: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.board.findMany({
      where: { members: { some: { userId } } },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarColor: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } } },
        _count: { select: { shapes: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  const seen = new Set<string>();
  const all = [...owned, ...member].filter((b) => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });

  return all.map(serializeBoard);
}

export async function getBoardById(boardId: string, userId: string) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      owner: { select: { id: true, name: true, email: true, avatarColor: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } } },
    },
  });

  if (!board) return null;

  const permission = resolvePermission(board, userId);
  if (!permission) return null;

  return { ...serializeBoard(board), permission };
}

export function resolvePermission(
  board: { ownerId: string; members: { userId: string; permission: string }[]; isPublic: boolean },
  userId: string,
): Permission | null {
  if (board.ownerId === userId) return 'owner';
  const member = board.members.find((m) => m.userId === userId);
  if (member) return member.permission as Permission;
  if (board.isPublic) return 'view';
  return null;
}

export async function createBoard(userId: string, title: string, description?: string) {
  const board = await prisma.board.create({
    data: {
      title,
      description,
      ownerId: userId,
    },
    include: {
      owner: { select: { id: true, name: true, email: true, avatarColor: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } } },
    },
  });
  return serializeBoard(board);
}

export async function updateBoard(boardId: string, userId: string, data: { title?: string; description?: string; isPublic?: boolean }) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw { statusCode: 404, message: 'Board not found' };
  if (board.ownerId !== userId) throw { statusCode: 403, message: 'Only the owner can update the board' };

  const updated = await prisma.board.update({
    where: { id: boardId },
    data,
    include: {
      owner: { select: { id: true, name: true, email: true, avatarColor: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } } },
    },
  });
  return serializeBoard(updated);
}

export async function deleteBoard(boardId: string, userId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw { statusCode: 404, message: 'Board not found' };
  if (board.ownerId !== userId) throw { statusCode: 403, message: 'Only the owner can delete the board' };

  const snapshots = await prisma.snapshot.findMany({ where: { boardId } });
  for (const snap of snapshots) {
    try { await deleteSnapshot(snap.key); } catch { /* ignore */ }
  }

  await prisma.board.delete({ where: { id: boardId } });
}

export async function shareBoard(boardId: string, ownerId: string, email: string, permission: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw { statusCode: 404, message: 'Board not found' };
  if (board.ownerId !== ownerId) throw { statusCode: 403, message: 'Only the owner can share the board' };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw { statusCode: 404, message: 'User not found with that email' };
  if (user.id === ownerId) throw { statusCode: 400, message: 'Cannot share with yourself' };

  const existing = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: user.id } },
  });

  if (existing) {
    const updated = await prisma.boardMember.update({
      where: { id: existing.id },
      data: { permission },
      include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } },
    });
    return { member: updated, updated: true };
  }

  const member = await prisma.boardMember.create({
    data: { boardId, userId: user.id, permission },
    include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } },
  });
  return { member, updated: false };
}

export async function updateMemberPermission(boardId: string, ownerId: string, userId: string, permission: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw { statusCode: 404, message: 'Board not found' };
  if (board.ownerId !== ownerId) throw { statusCode: 403, message: 'Only the owner can change permissions' };

  const member = await prisma.boardMember.update({
    where: { boardId_userId: { boardId, userId } },
    data: { permission },
    include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } },
  });
  return member;
}

export async function removeMember(boardId: string, ownerId: string, userId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw { statusCode: 404, message: 'Board not found' };
  if (board.ownerId !== ownerId) throw { statusCode: 403, message: 'Only the owner can remove members' };

  await prisma.boardMember.delete({
    where: { boardId_userId: { boardId, userId } },
  });
}

export async function saveSnapshot(boardId: string, userId: string, jsonState: string) {
  const key = `snapshots/${boardId}/${Date.now()}.json`;
  const { size } = await uploadSnapshot(key, jsonState);
  const snapshot = await prisma.snapshot.create({
    data: { boardId, key, size, createdBy: userId },
  });
  return snapshot;
}

export async function getSnapshots(boardId: string) {
  return prisma.snapshot.findMany({
    where: { boardId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getSnapshotData(key: string) {
  return getSnapshot(key);
}

export async function getBoardShapes(boardId: string) {
  return prisma.shape.findMany({ where: { boardId } });
}

export async function upsertShape(boardId: string, elementId: string, type: string, data: unknown, userId?: string) {
  return prisma.shape.upsert({
    where: { boardId_elementId: { boardId, elementId } },
    create: { boardId, elementId, type, data: data as object, userId },
    update: { data: data as object, userId },
  });
}

export async function deleteShape(boardId: string, elementId: string) {
  try {
    await prisma.shape.delete({
      where: { boardId_elementId: { boardId, elementId } },
    });
  } catch {
    // shape may not exist
  }
}

function serializeBoard(board: any) {
  return {
    id: board.id,
    title: board.title,
    description: board.description,
    isPublic: board.isPublic,
    ownerId: board.ownerId,
    owner: board.owner,
    members: board.members?.map((m: any) => ({
      id: m.id,
      userId: m.userId,
      permission: m.permission,
      user: m.user,
    })) ?? [],
    shapeCount: board._count?.shapes ?? 0,
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString(),
  };
}
