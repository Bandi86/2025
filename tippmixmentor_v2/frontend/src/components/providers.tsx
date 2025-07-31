'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';
import { getAccessToken } from '@/lib/auth';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  sendMessage: (event: string, data: any) => void;
  subscribe: (callback: (message: WebSocketMessage) => void) => () => void;
  subscribeToError: (callback: (error: Error) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}

function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messageListeners = useRef<Set<(message: WebSocketMessage) => void>>(new Set());
  const errorListeners = useRef<Set<(error: Error) => void>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const { user } = useAuth();

  const connect = useCallback(() => {
    if (socketRef.current?.connected || isConnecting) {
      return;
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnecting(true);
    setError(null);

    const url = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    
    try {
      console.log('Attempting Socket.IO connection to:', url);
      
      // Create Socket.IO connection with authentication
      const accessToken = getAccessToken();
      socketRef.current = io(url, {
        auth: {
          token: accessToken || null
        },
        autoConnect: false,
        reconnection: false, // We'll handle reconnection manually
        timeout: 10000,
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('Socket.IO connected successfully');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttempts.current = 0; // Reset reconnect attempts on successful connection
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket.IO connection disconnected:', reason);
        setIsConnected(false);
        setIsConnecting(false);
        
        // Attempt to reconnect if not a normal disconnection
        if (reason !== 'io client disconnect' && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Exponential backoff
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        const errorObj = new Error(`Socket.IO connection error: ${error.message}`);
        setError(errorObj);
        setIsConnecting(false);
        errorListeners.current.forEach(listener => listener(errorObj));
      });

      socket.on('error', (error) => {
        console.error('Socket.IO error:', error);
        const errorObj = new Error(`Socket.IO error: ${error.message || 'Unknown error'}`);
        setError(errorObj);
        setIsConnecting(false);
        errorListeners.current.forEach(listener => listener(errorObj));
      });

      // Handle specific message types
      socket.on('matchUpdate', (data) => {
        const message: WebSocketMessage = {
          type: 'matchUpdate',
          data,
          timestamp: new Date().toISOString(),
        };
        messageListeners.current.forEach(listener => listener(message));
      });

      socket.on('agentEvent', (data) => {
        const message: WebSocketMessage = {
          type: 'agentEvent',
          data,
          timestamp: new Date().toISOString(),
        };
        messageListeners.current.forEach(listener => listener(message));
      });

      socket.on('agentStatusUpdate', (data) => {
        const message: WebSocketMessage = {
          type: 'agentStatusUpdate',
          data,
          timestamp: new Date().toISOString(),
        };
        messageListeners.current.forEach(listener => listener(message));
      });

      socket.on('predictionUpdate', (data) => {
        const message: WebSocketMessage = {
          type: 'predictionUpdate',
          data,
          timestamp: new Date().toISOString(),
        };
        messageListeners.current.forEach(listener => listener(message));
      });

      socket.on('notification', (data) => {
        const message: WebSocketMessage = {
          type: 'notification',
          data,
          timestamp: new Date().toISOString(),
        };
        messageListeners.current.forEach(listener => listener(message));
      });

      // Handle connection confirmation
      socket.on('connected', (data) => {
        const message: WebSocketMessage = {
          type: 'connected',
          data,
          timestamp: new Date().toISOString(),
        };
        messageListeners.current.forEach(listener => listener(message));
      });

      // Connect the socket
      socket.connect();
    } catch (err) {
      console.error('Failed to create Socket.IO connection:', err);
      const error = err instanceof Error ? err : new Error('Failed to connect to Socket.IO');
      setError(error);
      setIsConnecting(false);
      errorListeners.current.forEach(listener => listener(error));
    }
  }, [isConnecting]);

  const sendMessage = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Socket.IO is not connected, cannot send message:', { event, data });
    }
  }, []);

  const subscribe = useCallback((callback: (message: WebSocketMessage) => void) => {
    messageListeners.current.add(callback);
    return () => {
      messageListeners.current.delete(callback);
    };
  }, []);

  const subscribeToError = useCallback((callback: (error: Error) => void) => {
    errorListeners.current.add(callback);
    return () => {
      errorListeners.current.delete(callback);
    };
  }, []);

  // Auto-connect when user is authenticated
  useEffect(() => {
    const accessToken = getAccessToken();
    if (accessToken && user) {
      connect();
    } else if (socketRef.current) {
      // Disconnect if user is not authenticated
      socketRef.current.disconnect();
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, [user, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close Socket.IO connection
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const value: WebSocketContextType = {
    isConnected,
    isConnecting,
    error,
    sendMessage,
    subscribe,
    subscribeToError,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </WebSocketProvider>
    </QueryClientProvider>
  )
} 