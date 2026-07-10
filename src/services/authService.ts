import type { User, LoginCredentials, RegisterCredentials } from '@/types';
import type { ApiResponse, LoginResponse } from '@/types/api';
import { apiService } from './base';
import { sleep } from '@/utils';

// Mock data
const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'user-2',
    email: 'bob@example.com',
    name: 'Bob Smith',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    createdAt: '2024-01-16T11:00:00Z',
    updatedAt: '2024-01-16T11:00:00Z',
  },
];

const MOCK_TOKEN = 'mock-jwt-token-' + Date.now();

class AuthService {
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    await sleep(800);

    const user = MOCK_USERS.find((u) => u.email === credentials.email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    return {
      success: true,
      data: {
        user,
        tokens: {
          accessToken: MOCK_TOKEN,
          refreshToken: `refresh-${MOCK_TOKEN}`,
          expiresIn: 3600,
        },
      },
    };
  }

  async register(credentials: RegisterCredentials): Promise<ApiResponse<LoginResponse>> {
    await sleep(1000);

    const existingUser = MOCK_USERS.find((u) => u.email === credentials.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email: credentials.email,
      name: credentials.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: {
        user: newUser,
        tokens: {
          accessToken: MOCK_TOKEN,
          refreshToken: `refresh-${MOCK_TOKEN}`,
          expiresIn: 3600,
        },
      },
    };
  }

  async logout(): Promise<ApiResponse<void>> {
    await sleep(500);
    return { success: true, data: undefined };
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    await sleep(300);
    return {
      success: true,
      data: MOCK_USERS[0],
    };
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<LoginResponse['tokens']>> {
    await sleep(500);
    return {
      success: true,
      data: {
        accessToken: `${MOCK_TOKEN}- refreshed`,
        refreshToken,
        expiresIn: 3600,
      },
    };
  }

  // API methods (for future backend connection)
  async loginApi(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    return apiService.post<LoginResponse>('/auth/login', credentials);
  }

  async registerApi(credentials: RegisterCredentials): Promise<ApiResponse<LoginResponse>> {
    return apiService.post<LoginResponse>('/auth/register', credentials);
  }

  async logoutApi(): Promise<ApiResponse<void>> {
    return apiService.post<void>('/auth/logout');
  }

  async getCurrentUserApi(): Promise<ApiResponse<User>> {
    return apiService.get<User>('/users/me');
  }
}

export const authService = new AuthService();
