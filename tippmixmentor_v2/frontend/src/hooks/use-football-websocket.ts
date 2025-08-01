import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface LiveMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
  minute?: number;
  league: string;
  odds?: Array<{
    provider: string;
    details: string;
    overUnder?: number;
    homeOdds?: number;
    awayOdds?: number;
    drawOdds?: number;
  }>;
  lastUpdated: string;
}

export interface StandingsData {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  source: string;
  confidence: number;
}

export interface OddsData {
  provider: string;
  details: string;
  overUnder?: number;
  homeOdds?: number;
  awayOdds?: number;
  drawOdds?: number;
  isLive: boolean;
}

export interface SystemStatus {
  espn: {
    status: string;
    lastCheck: string;
  };
  apiFootball: {
    status: string;
    rateLimit?: any;
    lastCheck: string;
  };
  footballData: {
    status: string;
    lastCheck: string;
  };
  lastSync: string;
}

export interface DataQualityReport {
  footballDataStatus: string;
  apiFootballStatus: string;
  espnStatus: string;
  mergedDataQuality: number;
  recommendations: string[];
}

interface UseFootballWebSocketOptions {
  autoConnect?: boolean;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const useFootballWebSocket = (options: UseFootballWebSocketOptions = {}) => {
  const {
    autoConnect = true,
    onError,
    onConnect,
    onDisconnect,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [standings, setStandings] = useState<Record<string, StandingsData[]>>({});
  const [odds, setOdds] = useState<Record<string, OddsData[]>>({});
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQualityReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/football-data`, {
      transports: ['websocket', 'polling'],
      autoConnect,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      onConnect?.();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      onDisconnect?.();
    });

    socket.on('connect_error', (err) => {
      setError(`Connection error: ${err.message}`);
      onError?.(err.message);
    });

    // Data events
    socket.on('live_matches_update', (data: { matches: LiveMatch[]; count: number; timestamp: string }) => {
      setLiveMatches(data.matches);
    });

    socket.on('standings_update', (data: { league: string; standings: StandingsData[]; timestamp: string }) => {
      setStandings(prev => ({
        ...prev,
        [data.league]: data.standings,
      }));
    });

    socket.on('odds_update', (data: { matchId: string; odds: OddsData[]; timestamp: string }) => {
      setOdds(prev => ({
        ...prev,
        [data.matchId]: data.odds,
      }));
    });

    socket.on('system_status', (data: { status: SystemStatus; timestamp: string }) => {
      setSystemStatus(data.status);
    });

    socket.on('data_quality_report', (data: { report: DataQualityReport; timestamp: string }) => {
      setDataQuality(data.report);
    });

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
      onError?.(data.message);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [autoConnect, onConnect, onDisconnect, onError]);

  // Subscribe to live matches
  const subscribeToLiveMatches = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('subscribe_live_matches');
    }
  }, [isConnected]);

  // Subscribe to standings for a specific league
  const subscribeToStandings = useCallback((leagueCode: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('subscribe_standings', leagueCode);
    }
  }, [isConnected]);

  // Subscribe to odds for a specific match
  const subscribeToOdds = useCallback((matchId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('subscribe_odds', matchId);
    }
  }, [isConnected]);

  // Unsubscribe from a channel
  const unsubscribe = useCallback((channel: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('unsubscribe', channel);
    }
  }, [isConnected]);

  // Request live matches data
  const getLiveMatches = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('get_live_matches');
    }
  }, [isConnected]);

  // Request standings data
  const getStandings = useCallback((leagueCode: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('get_standings', leagueCode);
    }
  }, [isConnected]);

  // Request odds data
  const getOdds = useCallback((eventId: string, competitionId: string, leagueCode: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('get_odds', { eventId, competitionId, leagueCode });
    }
  }, [isConnected]);

  // Connect manually
  const connect = useCallback(() => {
    if (socketRef.current && !isConnected) {
      socketRef.current.connect();
    }
  }, [isConnected]);

  // Disconnect manually
  const disconnect = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.disconnect();
    }
  }, [isConnected]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Connection state
    isConnected,
    error,
    
    // Data
    liveMatches,
    standings,
    odds,
    systemStatus,
    dataQuality,
    
    // Methods
    connect,
    disconnect,
    subscribeToLiveMatches,
    subscribeToStandings,
    subscribeToOdds,
    unsubscribe,
    getLiveMatches,
    getStandings,
    getOdds,
    clearError,
  };
}; 