'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Activity, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useWebSocketContext } from '@/components/providers';
import { useAuth } from '@/hooks/use-auth';
import { getAccessToken } from '@/lib/auth';
import { useState, useEffect } from 'react';

export function HealthStatus() {
  const { isConnected, isConnecting, error } = useWebSocketContext();
  const { user, isAuthenticated } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [clientInfo, setClientInfo] = useState<{
    hasToken: boolean;
    lastUpdate: string;
  }>({
    hasToken: false,
    lastUpdate: '',
  });

  // Handle client-side only values to prevent hydration mismatch
  useEffect(() => {
    setClientInfo({
      hasToken: !!getAccessToken(),
      lastUpdate: new Date().toLocaleTimeString(),
    });
  }, []);

  // Update the last update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setClientInfo(prev => ({
        ...prev,
        lastUpdate: new Date().toLocaleTimeString(),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (isConnecting) {
      return <Activity className="h-4 w-4 animate-spin" />;
    }
    if (isConnected) {
      return <CheckCircle className="h-4 w-4" />;
    }
    if (error) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    return <WifiOff className="h-4 w-4" />;
  };

  const getStatusColor = () => {
    if (isConnecting) {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (isConnected) {
      return 'bg-green-100 text-green-800';
    }
    if (error) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = () => {
    if (isConnecting) {
      return 'Connecting...';
    }
    if (isConnected) {
      return 'Connected';
    }
    if (error) {
      return 'Error';
    }
    return 'Disconnected';
  };

  const handleDebug = () => {
    const accessToken = getAccessToken();
    const debug = {
      isAuthenticated,
      hasUser: !!user,
      hasToken: !!accessToken,
      tokenLength: accessToken?.length || 0,
      wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
      timestamp: new Date().toISOString(),
      clientInfo,
    };
    setDebugInfo(JSON.stringify(debug, null, 2));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          WebSocket Status
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDebug}
            className="ml-auto h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </CardTitle>
        <CardDescription>
          Real-time connection status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
          <Badge className={getStatusColor()}>
            {isConnected ? 'ONLINE' : isConnecting ? 'CONNECTING' : 'OFFLINE'}
          </Badge>
        </div>
        
        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            <strong>Error:</strong> {error.message}
          </div>
        )}
        
        <div className="mt-3 text-xs text-gray-500">
          <div>Auth: {isAuthenticated ? 'Yes' : 'No'}</div>
          <div>User: {user ? 'Yes' : 'No'}</div>
          <div>Token: {clientInfo.hasToken ? 'Yes' : 'No'}</div>
          <div>Last update: {clientInfo.lastUpdate || 'Loading...'}</div>
        </div>

        {debugInfo && (
          <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
            <pre className="whitespace-pre-wrap">{debugInfo}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 