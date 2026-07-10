import type { User, LoginCredentials, RegisterCredentials } from '@/types';
import type { LoginResponse } from '@/types/api';
import { apiService } from './base';

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return apiService.post<LoginResponse>('/auth/login', credentials);
  }

  async register(credentials: RegisterCredentials): Promise<LoginResponse> {
    return apiService.post<LoginResponse>('/auth/register', credentials);
  }

  async logout(refreshToken: string): Promise<void> {
    await apiService.post<void>('/auth/logout', { refreshToken });
  }

  async getCurrentUser(): Promise<User> {
    return apiService.get<User>('/users/me');
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    return apiService.post<LoginResponse>('/auth/refresh', { refreshToken });
  }
}

export const authService = new AuthService();
