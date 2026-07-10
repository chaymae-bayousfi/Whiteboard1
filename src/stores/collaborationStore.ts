import { create } from 'zustand';
import type { CollaboratorCursor, User } from '@/types';
import { CURSOR_COLORS } from '@/constants';

interface CollaborationStore {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  onlineUsers: User[];
  cursors: CollaboratorCursor[];
  currentUserColor: string;
  showCursors: boolean;

  setConnected: (connected: boolean) => void;
  setConnectionStatus: (status: CollaborationStore['connectionStatus']) => void;
  setOnlineUsers: (users: User[]) => void;
  addOnlineUser: (user: User) => void;
  removeOnlineUser: (userId: string) => void;
  updateCursor: (userId: string, x: number, y: number) => void;
  setCurrentUserColor: (color: string) => void;
  setShowCursors: (show: boolean) => void;
  setCursors: (cursors: CollaboratorCursor[]) => void;
  addCursor: (cursor: CollaboratorCursor) => void;
  removeCursor: (userId: string) => void;
}

export const useCollaborationStore = create<CollaborationStore>((set) => ({
  isConnected: false,
  connectionStatus: 'disconnected',
  onlineUsers: [],
  cursors: [],
  currentUserColor: CURSOR_COLORS[0],
  showCursors: true,

  setConnected: (connected) => set({ isConnected: connected }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  addOnlineUser: (user) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.some((u) => u.id === user.id)
        ? state.onlineUsers
        : [...state.onlineUsers, user],
    })),

  removeOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((u) => u.id !== userId),
      cursors: state.cursors.filter((c) => c.userId !== userId),
    })),

  updateCursor: (userId, x, y) =>
    set((state) => ({
      cursors: state.cursors.map((cursor) =>
        cursor.userId === userId
          ? { ...cursor, x, y, lastSeen: new Date().toISOString() }
          : cursor
      ),
    })),

  setCurrentUserColor: (color) => set({ currentUserColor: color }),

  setShowCursors: (show) => set({ showCursors: show }),

  setCursors: (cursors) => set({ cursors }),

  addCursor: (cursor) =>
    set((state) => ({
      cursors: state.cursors.some((c) => c.userId === cursor.userId)
        ? state.cursors
        : [...state.cursors, cursor],
    })),

  removeCursor: (userId) =>
    set((state) => ({
      cursors: state.cursors.filter((c) => c.userId !== userId),
    })),
}));

export function assignCursorColor(index: number): string {
  return CURSOR_COLORS[index % CURSOR_COLORS.length];
}
