import { jwtDecode } from 'jwt-decode';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  avatar?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// API Base URL - Use Next.js API routes for client-side requests
const API_BASE_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Token utilities
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (tokens: AuthTokens): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
};

export const clearTokens = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp ? decoded.exp < currentTime : true;
  } catch {
    return true;
  }
};

export const getUserFromToken = (token: string): User | null => {
  try {
    const decoded = jwtDecode(token) as any;
    return {
      id: decoded.sub,
      email: decoded.email,
      username: decoded.username || '',
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      role: decoded.role,
    };
  } catch {
    return null;
  }
};

const hasMessage = (data: any): data is { message: string } => typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string';

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(hasMessage(errorData) ? errorData.message : `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// API client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth header if token exists
    const token = getAccessToken();
    if (token && !isTokenExpired(token)) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(hasMessage(errorData) ? errorData.message : `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints - Use Next.js API routes for client-side requests
  async login(data: LoginRequest): Promise<AuthResponse> {
    const endpoint = typeof window !== 'undefined' ? '/api/auth/login' : '/api/v1/auth/login';
    return this.request<AuthResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const endpoint = typeof window !== 'undefined' ? '/api/auth/register' : '/api/v1/auth/register';
    return this.request<AuthResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refreshToken(data: RefreshTokenRequest): Promise<AuthTokens> {
    const endpoint = typeof window !== 'undefined' ? '/api/auth/refresh' : '/api/v1/auth/refresh';
    return this.request<AuthTokens>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<{ message: string }> {
    const endpoint = typeof window !== 'undefined' ? '/api/auth/logout' : '/api/v1/auth/logout';
    return this.request<{ message: string }>(endpoint, {
      method: 'POST',
    });
  }

  // User endpoints
  async getProfile(): Promise<User> {
    return this.request<User>('/api/v1/users/profile');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request<User>('/api/v1/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Auth service
export class AuthService {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.login(credentials);
    setTokens(response);
    return response;
  }

  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.register(userData);
    setTokens(response);
    return response;
  }

  static async refreshToken(): Promise<AuthTokens | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const tokens = await apiClient.refreshToken({ refreshToken });
      setTokens(tokens);
      return tokens;
    } catch (error) {
      clearTokens();
      return null;
    }
  }

  static async logout(): Promise<void> {
    try {
      await apiClient.logout();
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      clearTokens();
    }
  }

  static getCurrentUser(): User | null {
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) {
      return null;
    }
    return getUserFromToken(token);
  }

  static isAuthenticated(): boolean {
    const token = getAccessToken();
    return token !== null && !isTokenExpired(token);
  }
} 