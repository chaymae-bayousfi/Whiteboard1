const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
let refreshPromise: Promise<boolean> | null = null;

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    let response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (response.status === 401 && !endpoint.startsWith('/auth/')) {
      const { useAuthStore } = await import('@/stores/authStore');
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        if (refreshPromise === null) {
          refreshPromise = import('./authService').then(async ({ authService }) => {
            try {
              const result = await authService.refreshToken(refreshToken);
              useAuthStore.getState().login(result.user, result.accessToken, result.refreshToken);
              return true;
            } catch {
              useAuthStore.getState().logout();
              return false;
            } finally {
              refreshPromise = null;
            }
          });
        }
        if (await refreshPromise) {
          response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
              ...this.getHeaders(),
              ...options.headers,
            },
          });
        }
      }
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = data?.error ?? `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return data as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiService = new ApiService();
