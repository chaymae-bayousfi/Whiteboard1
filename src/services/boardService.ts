import type { Board, CreateBoardDto, UpdateBoardDto } from '@/types';
import type { ApiResponse } from '@/types/api';
import { apiService } from './base';
import { sleep } from '@/utils';

// Mock board data
let MOCK_BOARDS: Board[] = [
  {
    id: 'board-1',
    title: 'Product Roadmap Q1',
    description: 'Planning and milestones for Q1 2024',
    thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&h=300&fit=crop',
    ownerId: 'user-1',
    collaborators: [
      {
        userId: 'user-2',
        user: {
          id: 'user-2',
          email: 'bob@example.com',
          name: 'Bob Smith',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
          createdAt: '2024-01-16T10:00:00Z',
          updatedAt: '2024-01-16T10:00:00Z',
        },
        permission: 'edit',
        joinedAt: '2024-01-17T14:00:00Z',
      },
    ],
    isPublic: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
    lastAccessedAt: '2024-02-10T09:00:00Z',
  },
  {
    id: 'board-2',
    title: 'Design System Components',
    description: 'Visual guide and component library',
    thumbnail: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=300&fit=crop',
    ownerId: 'user-1',
    collaborators: [],
    isPublic: true,
    createdAt: '2024-01-18T11:00:00Z',
    updatedAt: '2024-02-05T16:00:00Z',
    lastAccessedAt: '2024-02-08T14:00:00Z',
  },
  {
    id: 'board-3',
    title: 'Team Retrospective',
    description: 'Sprint 5 team retrospective notes',
    ownerId: 'user-1',
    collaborators: [],
    isPublic: false,
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z',
    lastAccessedAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 'board-4',
    title: 'User Flow Diagrams',
    description: 'Onboarding and checkout flows',
    thumbnail: 'https://images.unsplash.com/photo-1541625602330-227d8d6a5a8d?w=400&h=300&fit=crop',
    ownerId: 'user-1',
    collaborators: [],
    isPublic: false,
    createdAt: '2024-01-22T14:00:00Z',
    updatedAt: '2024-01-28T11:00:00Z',
    lastAccessedAt: '2024-01-28T11:00:00Z',
  },
];

class BoardService {
  async getBoards(): Promise<ApiResponse<Board[]>> {
    await sleep(600);
    return { success: true, data: MOCK_BOARDS };
  }

  async getBoard(id: string): Promise<ApiResponse<Board>> {
    await sleep(400);
    const board = MOCK_BOARDS.find((b) => b.id === id);
    if (!board) {
      throw new Error('Board not found');
    }
    return { success: true, data: board };
  }

  async createBoard(data: CreateBoardDto): Promise<ApiResponse<Board>> {
    await sleep(800);
    const newBoard: Board = {
      id: `board-${Date.now()}`,
      title: data.title,
      description: data.description,
      ownerId: 'user-1',
      collaborators: [],
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_BOARDS = [newBoard, ...MOCK_BOARDS];
    return { success: true, data: newBoard };
  }

  async updateBoard(id: string, data: UpdateBoardDto): Promise<ApiResponse<Board>> {
    await sleep(500);
    const board = MOCK_BOARDS.find((b) => b.id === id);
    if (!board) {
      throw new Error('Board not found');
    }
    Object.assign(board, data, {
      updatedAt: new Date().toISOString(),
    });
    return { success: true, data: board };
  }

  async deleteBoard(id: string): Promise<ApiResponse<void>> {
    await sleep(500);
    MOCK_BOARDS = MOCK_BOARDS.filter((b) => b.id !== id);
    return { success: true, data: undefined };
  }

  async searchBoards(query: string): Promise<ApiResponse<Board[]>> {
    await sleep(300);
    const filtered = MOCK_BOARDS.filter(
      (b) =>
        b.title.toLowerCase().includes(query.toLowerCase()) ||
        b.description?.toLowerCase().includes(query.toLowerCase())
    );
    return { success: true, data: filtered };
  }

  // API methods (for future backend connection)
  async getBoardsApi(): Promise<ApiResponse<Board[]>> {
    return apiService.get<Board[]>('/boards');
  }

  async getBoardApi(id: string): Promise<ApiResponse<Board>> {
    return apiService.get<Board>(`/boards/${id}`);
  }

  async createBoardApi(data: CreateBoardDto): Promise<ApiResponse<Board>> {
    return apiService.post<Board>('/boards', data);
  }

  async updateBoardApi(id: string, data: UpdateBoardDto): Promise<ApiResponse<Board>> {
    return apiService.patch<Board>(`/boards/${id}`, data);
  }

  async deleteBoardApi(id: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/boards/${id}`);
  }
}

export const boardService = new BoardService();
