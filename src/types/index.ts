export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  avatarColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export type Permission = 'view' | 'edit' | 'admin';

export interface Board {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  ownerId: string;
  owner?: User;
  collaborators: BoardCollaborator[];
  members?: BoardMember[];
  isPublic: boolean;
  publicPermission?: 'view' | 'edit';
  shapeCount?: number;
  permission?: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
}

export interface BoardMember {
  id: string;
  userId: string;
  permission: string;
  user: User;
}

export interface BoardCollaborator {
  userId: string;
  user: User;
  permission: Permission;
  joinedAt: string;
}

export interface CreateBoardDto {
  title: string;
  description?: string;
  isPublic?: boolean;
  publicPermission?: 'view' | 'edit';
}

export interface UpdateBoardDto {
  title?: string;
  description?: string;
  isPublic?: boolean;
  publicPermission?: 'view' | 'edit';
}

export type ToolType =
  | 'select'
  | 'pan'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'pencil'
  | 'text'
  | 'eraser';

export interface CanvasElement {
  id: string;
  type: 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'pencil' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  points?: number[];
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  opacity: number;
  locked: boolean;
}

export interface CanvasState {
  elements: CanvasElement[];
  selectedIds: string[];
  zoom: number;
  panX: number;
  panY: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface CollaboratorCursor {
  userId: string;
  user: User;
  x: number;
  y: number;
  color: string;
  lastSeen: string;
}

export interface CollaborationState {
  cursors: CollaboratorCursor[];
  onlineUsers: User[];
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
}

export type ThemeMode = 'light' | 'dark';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  type: 'create-board' | 'delete-board' | 'rename-board' | 'share' | 'invite' | 'export' | null;
  data?: Record<string, unknown>;
}
