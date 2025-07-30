import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    autoConnect = true,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      socketRef.current = io(url, {
        transports: ['websocket', 'polling'],
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        onConnect?.();
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        setIsConnecting(false);
        onDisconnect?.();
      });

      socket.on('connect_error', (err) => {
        setError(err);
        setIsConnecting(false);
        onError?.(err);
      });

      socket.on('error', (err) => {
        setError(err);
        onError?.(err);
      });

      // Handle specific message types
      socket.on('matchData', (data) => {
        const message: WebSocketMessage = {
          type: 'matchData',
          data,
          timestamp: new Date().toISOString(),
        };
        setLastMessage(message);
        onMessage?.(message);
      });

      socket.on('matchUpdate', (data) => {
        const message: WebSocketMessage = {
          type: 'matchUpdate',
          data,
          timestamp: new Date().toISOString(),
        };
        setLastMessage(message);
        onMessage?.(message);
      });

      socket.on('matchStart', (data) => {
        const message: WebSocketMessage = {
          type: 'matchStart',
          data,
          timestamp: new Date().toISOString(),
        };
        setLastMessage(message);
        onMessage?.(message);
      });

      socket.on('matchEnd', (data) => {
        const message: WebSocketMessage = {
          type: 'matchEnd',
          data,
          timestamp: new Date().toISOString(),
        };
        setLastMessage(message);
        onMessage?.(message);
      });

      socket.on('goalScored', (data) => {
        const message: WebSocketMessage = {
          type: 'goalScored',
          data,
          timestamp: new Date().toISOString(),
        };
        setLastMessage(message);
        onMessage?.(message);
      });

      socket.on('cardGiven', (data) => {
        const message: WebSocketMessage = {
          type: 'cardGiven',
          data,
          timestamp: new Date().toISOString(),
        };
        setLastMessage(message);
        onMessage?.(message);
      });

      socket.on('liveMatches', (data) => {
        const message: WebSocketMessage = {
          type: 'liveMatches',
          data,
          timestamp: new Date().toISOString(),
        };
        setLastMessage(message);
        onMessage?.(message);
      });

      socket.on('upcomingMatches', (data) => {
        const message: WebSocketMessage = {
          type: 'upcomingMatches',
          data,
          timestamp: new Date().toISOString(),
        };
        setLastMessage(message);
        onMessage?.(message);
      });

      socket.connect();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect to WebSocket');
      setError(error);
      setIsConnecting(false);
      onError?.(error);
    }
  }, [url, onConnect, onDisconnect, onError, onMessage]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const sendMessage = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  const subscribeToMatch = useCallback((matchId: string) => {
    sendMessage('subscribeToMatch', { matchId });
  }, [sendMessage]);

  const unsubscribeFromMatch = useCallback((matchId: string) => {
    sendMessage('unsubscribeFromMatch', { matchId });
  }, [sendMessage]);

  const getLiveMatches = useCallback(() => {
    sendMessage('getLiveMatches', {});
  }, [sendMessage]);

  const getUpcomingMatches = useCallback((limit?: number) => {
    sendMessage('getUpcomingMatches', { limit });
  }, [sendMessage]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
    subscribeToMatch,
    unsubscribeFromMatch,
    getLiveMatches,
    getUpcomingMatches,
  };
} 