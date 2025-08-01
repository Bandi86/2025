import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './alert';
import { Badge } from './badge';
import { Button } from './button';
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw 
} from 'lucide-react';

interface SystemStatus {
  status: 'online' | 'offline' | 'degraded';
  lastUpdated: number;
  providers: {
    name: string;
    status: 'online' | 'offline' | 'degraded';
    delay?: number; // in seconds
  }[];
}

interface StatusBannerProps {
  lastUpdatedAt?: number | null;
  onRefresh?: () => void;
  className?: string;
}

export function StatusBanner({ 
  lastUpdatedAt, 
  onRefresh,
  className = '' 
}: StatusBannerProps) {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    status: 'online',
    lastUpdated: Date.now(),
    providers: [
      { name: 'ESPN API', status: 'online' },
      { name: 'Live Data', status: 'online' },
      { name: 'Predictions', status: 'online' },
    ]
  });

  const [isVisible, setIsVisible] = useState(true);

  // Calculate time since last update
  const getTimeSinceUpdate = () => {
    if (!lastUpdatedAt) return 'Unknown';
    
    const now = Date.now();
    const diff = now - lastUpdatedAt;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  // Get overall status
  const getOverallStatus = () => {
    const hasOffline = systemStatus.providers.some(p => p.status === 'offline');
    const hasDegraded = systemStatus.providers.some(p => p.status === 'degraded');
    
    if (hasOffline) return 'offline';
    if (hasDegraded) return 'degraded';
    return 'online';
  };

  const overallStatus = getOverallStatus();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'offline': return <WifiOff className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-50 border-green-200 text-green-800';
      case 'degraded': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'offline': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // Auto-hide after 10 seconds if everything is online
  useEffect(() => {
    if (overallStatus === 'online' && lastUpdatedAt) {
      const timer = setTimeout(() => setIsVisible(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [overallStatus, lastUpdatedAt]);

  // Show banner if there are issues or if it's been manually triggered
  const shouldShow = isVisible && (
    overallStatus !== 'online' || 
    !lastUpdatedAt || 
    (Date.now() - (lastUpdatedAt || 0)) > 300000 // 5 minutes
  );

  if (!shouldShow) return null;

  return (
    <Alert className={`${getStatusColor(overallStatus)} ${className}`}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          {getStatusIcon(overallStatus)}
          <AlertDescription className="flex items-center gap-4">
            <span className="font-medium">
              {overallStatus === 'online' ? 'All systems operational' :
               overallStatus === 'degraded' ? 'Some services degraded' :
               'Some services offline'}
            </span>
            <span className="text-sm">
              Last updated: {getTimeSinceUpdate()}
            </span>
          </AlertDescription>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Provider status badges */}
          {systemStatus.providers.map((provider, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="text-xs"
            >
              {provider.name}: {provider.status}
            </Badge>
          ))}
          
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </div>
    </Alert>
  );
} 