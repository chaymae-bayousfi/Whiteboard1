import { create } from 'zustand';
import type { Board, CreateBoardDto, UpdateBoardDto } from '@/types';

interface BoardStore {
  boards: Board[];
  currentBoard: Board | null;
  isLoading: boolean;
  searchQuery: string;
  recentBoards: Board[];

  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;
  updateBoard: (id: string, updates: UpdateBoardDto) => void;
  deleteBoard: (id: string) => void;
  setCurrentBoard: (board: Board | null) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  updateRecentBoards: (board: Board) => void;
}

export const useBoardStore = create<BoardStore>((set) => ({
  boards: [],
  currentBoard: null,
  isLoading: false,
  searchQuery: '',
  recentBoards: [],

  setBoards: (boards) => set({ boards }),

  addBoard: (board) =>
    set((state) => ({
      boards: [board, ...state.boards],
    })),

  updateBoard: (id, updates) =>
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === id ? { ...board, ...updates, updatedAt: new Date().toISOString() } : board
      ),
      currentBoard:
        state.currentBoard?.id === id
          ? { ...state.currentBoard, ...updates, updatedAt: new Date().toISOString() }
          : state.currentBoard,
    })),

  deleteBoard: (id) =>
    set((state) => ({
      boards: state.boards.filter((board) => board.id !== id),
      currentBoard: state.currentBoard?.id === id ? null : state.currentBoard,
    })),

  setCurrentBoard: (board) => set({ currentBoard: board }),

  setLoading: (loading) => set({ isLoading: loading }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  updateRecentBoards: (board) =>
    set((state) => {
      const filtered = state.recentBoards.filter((b) => b.id !== board.id);
      const updated = [{ ...board, lastAccessedAt: new Date().toISOString() }, ...filtered].slice(
        0,
        5
      );
      return { recentBoards: updated };
    }),
}));

export function createNewBoard(data: CreateBoardDto, userId: string): Board {
  return {
    id: `board-${Date.now()}`,
    title: data.title,
    description: data.description,
    ownerId: userId,
    collaborators: [],
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
