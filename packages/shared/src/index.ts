// Shared types used by both frontend and backend

export type Permission = 'owner' | 'admin' | 'edit' | 'view';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BoardMember {
  id: string;
  userId: string;
  permission: string;
  user: User;
}

export interface Board {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  ownerId: string;
  owner: User;
  members: BoardMember[];
  shapeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
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
  type: ToolType;
  x: number;
  y: number;
  width: number;
  height: number;
  points?: number[];
  text?: string;
  stroke: string;
  fill: string;
  strokeWidth: number;
  fontSize?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

export interface CursorPayload {
  type: 'cursor';
  x: number;
  y: number;
  userId: string;
  name: string;
  color: string;
}

export interface PresencePayload {
  type: 'presence';
  action: 'join' | 'leave';
  userId: string;
  name: string;
  color: string;
}
