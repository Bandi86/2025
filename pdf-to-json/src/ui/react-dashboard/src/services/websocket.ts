import { io, Socket } from 'socket.io-client';

export interface ProcessingEvent {
  type: 'processing_started' | 'processing_progress' | 'processing_completed' | 'new_file_detected' | 'error';
  data: any;
  timestamp: string;
}

export interface SystemStatus {
  processing_queue_length: number;
  active_jobs: number;
  cache_hit_ratio: number;
  memory_usage: number;
  cpu_usage: number;
  disk_usage: number;
  error_rate: number;
  average_processing_time: number;
}

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io('ws://localhost:8000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.emit('connection', { connected: true });
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.emit('connection', { connected: false });
    });

    this.socket.on('processing_event', (event: ProcessingEvent) => {
      this.emit('processing_event', event);
    });

    this.socket.on('system_status', (status: SystemStatus) => {
      this.emit('system_status', status);
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  sendMessage(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();