import type { Board, CreateBoardDto, UpdateBoardDto, BoardMember, User, Permission } from '@/types';
import { apiService } from './base';

interface BoardsResponse {
  boards: Board[];
}

interface BoardResponse {
  board: Board;
}

interface Snapshot {
  id: string;
  boardId: string;
  key: string;
  size: number;
  createdBy: string;
  createdAt: string;
}

interface ApiBoardMember {
  id: string;
  userId: string;
  permission: string;
  createdAt?: string;
  user: User;
}

interface ApiBoard {
  id: string;
  title: string;
  description?: string | null;
  ownerId: string;
  owner?: User;
  members?: ApiBoardMember[];
  isPublic: boolean;
  publicPermission?: 'view' | 'edit';
  shapeCount?: number;
  permission?: string;
  createdAt: string;
  updatedAt: string;
}

class BoardService {
  async getBoards(): Promise<Board[]> {
    const res = await apiService.get<BoardsResponse>('/boards');
    return res.boards.map(this.normalizeBoard);
  }

  async getBoard(id: string): Promise<Board> {
    const res = await apiService.get<BoardResponse>(`/boards/${id}`);
    return this.normalizeBoard(res.board);
  }

  async getPublicBoard(id: string): Promise<Board> {
    const res = await apiService.get<BoardResponse>(`/boards/${id}/public`);
    return this.normalizeBoard(res.board);
  }

  async createBoard(data: CreateBoardDto): Promise<Board> {
    const res = await apiService.post<BoardResponse>('/boards', data);
    return this.normalizeBoard(res.board);
  }

  async updateBoard(id: string, data: UpdateBoardDto): Promise<Board> {
    const res = await apiService.patch<BoardResponse>(`/boards/${id}`, data);
    return this.normalizeBoard(res.board);
  }

  async deleteBoard(id: string): Promise<void> {
    await apiService.delete<void>(`/boards/${id}`);
  }

  async shareBoard(id: string, email: string, permission: string): Promise<{ member: BoardMember; updated: boolean }> {
    return apiService.post<{ member: BoardMember; updated: boolean }>(`/boards/${id}/share`, { email, permission });
  }

  async updateMemberPermission(id: string, userId: string, permission: string): Promise<BoardMember> {
    const res = await apiService.patch<{ member: BoardMember }>(`/boards/${id}/members/${userId}`, { permission });
    return res.member;
  }

  async removeMember(id: string, userId: string): Promise<void> {
    await apiService.delete<void>(`/boards/${id}/members/${userId}`);
  }

  async saveSnapshot(id: string, data: string): Promise<Snapshot> {
    const res = await apiService.post<{ snapshot: Snapshot }>(`/boards/${id}/snapshots`, { data });
    return res.snapshot;
  }

  async getSnapshots(id: string): Promise<Snapshot[]> {
    const res = await apiService.get<{ snapshots: Snapshot[] }>(`/boards/${id}/snapshots`);
    return res.snapshots;
  }

  async getSnapshotData(id: string, snapshotId: string): Promise<string> {
    const res = await apiService.get<{ data: string }>(`/boards/${id}/snapshots/${snapshotId}`);
    return res.data;
  }

  private normalizeBoard(board: ApiBoard): Board {
    return {
      id: board.id,
      title: board.title,
      description: board.description ?? undefined,
      ownerId: board.ownerId,
      owner: board.owner,
      collaborators: (board.members ?? []).map((m) => ({
        userId: m.userId,
        user: m.user,
        permission: m.permission as Permission,
        joinedAt: m.createdAt ?? new Date().toISOString(),
      })),
      members: board.members ?? [],
      isPublic: board.isPublic,
      publicPermission: board.publicPermission === 'edit' ? 'edit' : 'view',
      shapeCount: board.shapeCount,
      permission: board.permission,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  }
}

export const boardService = new BoardService();
