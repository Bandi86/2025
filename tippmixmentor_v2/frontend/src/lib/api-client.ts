import { getAccessToken, isTokenExpired } from './auth';

// Types for API responses
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
    ml_service: 'healthy' | 'unhealthy';
  };
  uptime: number;
  version: string;
}

export interface PerformanceMetrics {
  responseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
  timestamp: string;
}

// Enhanced API Client with Gateway Integration
export class ApiClient {
  private baseUrl: string;
  private requestTimeout: number;
  private retryAttempts: number;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    this.requestTimeout = 10000; // 10 seconds
    this.retryAttempts = 3;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const startTime = Date.now();

    // Add auth header if token exists
    const token = getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (token && !isTokenExpired(token)) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
    config.signal = controller.signal;

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        const responseTime = Date.now() - startTime;

        // Log request/response
        this.logRequest(url, config, response, responseTime);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const apiError: ApiError = {
            message: errorData.message || `HTTP error! status: ${response.status}`,
            status: response.status,
            code: errorData.code,
            details: errorData.details,
            timestamp: new Date().toISOString(),
          };

          // Log error
          this.logError(apiError, attempt);

          if (attempt === this.retryAttempts) {
            throw new Error(apiError.message);
          }

          // Wait before retry (exponential backoff)
          await this.delay(Math.pow(2, attempt) * 1000);
          continue;
        }

        const data = await response.json();
        return data as T;

      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout');
        }

        if (attempt === this.retryAttempts) {
          throw lastError;
        }

        // Wait before retry
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    throw lastError;
  }

  private logRequest(url: string, config: RequestInit, response: Response, responseTime: number) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${config.method || 'GET'} ${url}`, {
        status: response.status,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private logError(error: ApiError, attempt: number) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[API Error] Attempt ${attempt}/${this.retryAttempts}:`, error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check endpoint
  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/health');
  }

  // Performance metrics endpoint
  async getMetrics(): Promise<PerformanceMetrics> {
    return this.request<PerformanceMetrics>('/metrics');
  }

  // Auth endpoints
  async login(data: { email: string; password: string }): Promise<any> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async register(data: { email: string; username: string; password: string }): Promise<any> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refreshToken(data: { refreshToken: string }): Promise<any> {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // User endpoints
  async getProfile(): Promise<any> {
    return this.request('/users/profile');
  }

  async updateProfile(data: Partial<any>): Promise<any> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Prediction endpoints
  async getPredictions(params?: Record<string, any>): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/predictions${queryString}`);
  }

  async createPrediction(data: any): Promise<any> {
    return this.request('/predictions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPredictionStats(): Promise<any> {
    return this.request('/predictions/stats');
  }

  async getPredictionAccuracy(): Promise<any> {
    return this.request('/predictions/accuracy');
  }

  // Match endpoints
  async getMatches(params?: Record<string, any>): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/matches${queryString}`);
  }

  async getMatch(matchId: string): Promise<any> {
    return this.request(`/matches/${matchId}`);
  }

  // Analytics endpoints
  async getAnalytics(): Promise<any> {
    return this.request('/analytics');
  }

  async getUserPerformance(): Promise<any> {
    return this.request('/analytics/user-performance');
  }

  async getModelPerformance(): Promise<any> {
    return this.request('/analytics/model-performance');
  }

  // ML Service endpoints
  async getMLServiceStatus(): Promise<any> {
    return this.request('/predictions/ml/status');
  }

  async getModelInfo(): Promise<any> {
    return this.request('/predictions/ml/models/info');
  }

  async getModelStatus(): Promise<any> {
    return this.request('/predictions/ml/models/status');
  }

  async trainModels(): Promise<any> {
    return this.request('/predictions/ml/train', {
      method: 'POST',
    });
  }

  async batchPredict(matchIds: string[]): Promise<any> {
    return this.request('/predictions/ml/batch-predict', {
      method: 'POST',
      body: JSON.stringify({ match_ids: matchIds }),
    });
  }

  // Live data endpoints
  async getLiveMatches(): Promise<any> {
    return this.request('/live-data/matches');
  }

  async getLiveMatchData(matchId: string): Promise<any> {
    return this.request(`/live-data/matches/${matchId}`);
  }

  // Notification endpoints
  async getNotifications(): Promise<any> {
    return this.request('/notifications');
  }

  async markNotificationAsRead(notificationId: string): Promise<any> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export for use in components
export default apiClient; 