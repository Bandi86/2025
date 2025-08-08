export interface ProcessingJob {
  id: string;
  file_name: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface GameData {
  league: string;
  date: string;
  iso_date: string;
  time: string;
  home_team: string;
  away_team: string;
  original_home_team: string;
  original_away_team: string;
  main_market: any;
  additional_markets: any[];
}

export interface ReportData {
  id: string;
  name: string;
  created_at: string;
  file_path: string;
  type: 'trend' | 'anomaly' | 'summary';
}

export interface SystemMetrics {
  processing_queue_length: number;
  active_jobs: number;
  cache_hit_ratio: number;
  memory_usage: number;
  cpu_usage: number;
  disk_usage: number;
  error_rate: number;
  average_processing_time: number;
}

class ApiService {
  private baseUrl = '/api/v1';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Processing endpoints
  async uploadFile(file: File): Promise<{ job_id: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/process/file`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getJobStatus(jobId: string): Promise<ProcessingJob> {
    return this.request<ProcessingJob>(`/process/status/${jobId}`);
  }

  async getQueue(): Promise<ProcessingJob[]> {
    return this.request<ProcessingJob[]>('/process/queue');
  }

  async cancelJob(jobId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/process/job/${jobId}`, {
      method: 'DELETE',
    });
  }

  // Data endpoints
  async getGames(date?: string): Promise<GameData[]> {
    const endpoint = date ? `/games/${date}` : '/games';
    return this.request<GameData[]>(endpoint);
  }

  async getReports(): Promise<ReportData[]> {
    return this.request<ReportData[]>('/reports/latest');
  }

  async getTrendReport(days: number = 30): Promise<any> {
    return this.request<any>(`/reports/trends?days=${days}`);
  }

  // System endpoints
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  async getMetrics(): Promise<SystemMetrics> {
    return this.request<SystemMetrics>('/metrics');
  }

  async getStatus(): Promise<any> {
    return this.request<any>('/status');
  }

  // Configuration endpoints
  async getConfig(): Promise<any> {
    return this.request<any>('/config');
  }

  async updateConfig(config: any): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async reloadConfig(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/config/reload', {
      method: 'POST',
    });
  }

  async validateConfig(config: any): Promise<{ valid: boolean; errors: any[] }> {
    return this.request<{ valid: boolean; errors: any[] }>('/config/validate', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async previewConfig(config: any): Promise<{ preview: any; changes: any[] }> {
    return this.request<{ preview: any; changes: any[] }>('/config/preview', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  // Configuration backup endpoints
  async getConfigBackups(): Promise<any[]> {
    return this.request<any[]>('/config/backups');
  }

  async createConfigBackup(name: string, description?: string): Promise<{ success: boolean; backup_id: string }> {
    return this.request<{ success: boolean; backup_id: string }>('/config/backups', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async restoreConfigBackup(backupId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/config/backups/${backupId}/restore`, {
      method: 'POST',
    });
  }

  async deleteConfigBackup(backupId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/config/backups/${backupId}`, {
      method: 'DELETE',
    });
  }

  async exportConfig(): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/config/export`);
    if (!response.ok) {
      throw new Error(`Export failed: ${response.status} ${response.statusText}`);
    }
    return response.blob();
  }

  async importConfig(file: File): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append('config_file', file);

    const response = await fetch(`${this.baseUrl}/config/import`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Import failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiService = new ApiService();