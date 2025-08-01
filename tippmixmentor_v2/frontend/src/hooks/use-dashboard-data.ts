'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DashboardDataService,
  type LiveMatch,
  type Prediction,
  type StatData,
  type AgentData,
} from '@/lib/api/dashboard-data';

export interface DashboardData {
  liveMatches: LiveMatch[];
  predictions: Prediction[];
  stats: StatData[];
  agents: AgentData[];
}

export interface UseDashboardDataResult {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdatedAt: number | null;
}

function isLiveMatchArray(v: unknown): v is LiveMatch[] {
  return Array.isArray(v) && v.every(m => typeof m?.homeTeam === 'string' && typeof m?.awayTeam === 'string');
}
function isPredictionArray(v: unknown): v is Prediction[] {
  return Array.isArray(v) && v.every(p => typeof p?.prediction === 'string' && typeof p?.confidence === 'number');
}
function isStatArray(v: unknown): v is StatData[] {
  return Array.isArray(v) && v.every(s => typeof s?.title === 'string' && typeof s?.value !== 'undefined');
}
function isAgentArray(v: unknown): v is AgentData[] {
  return Array.isArray(v) && v.every(a => typeof a?.name === 'string' && typeof a?.type === 'string');
}

export function useDashboardData(): UseDashboardDataResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // cancel any previous request
      abortRef.current?.abort();
    } catch {
      // no-op
    }
    abortRef.current = new AbortController();

    try {
      const result: any = await DashboardDataService.getAllDashboardData();

      const shaped: DashboardData = {
        liveMatches: isLiveMatchArray(result?.liveMatches) ? result.liveMatches : [],
        predictions: isPredictionArray(result?.predictions) ? result.predictions : [],
        stats: isStatArray(result?.stats) ? result.stats : [],
        agents: isAgentArray(result?.agents) ? result.agents : [],
      };

      setData(shaped);
      setLastUpdatedAt(Date.now());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load dashboard data';
      setError(msg);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
    return () => {
      try {
        abortRef.current?.abort();
      } catch {
        // no-op
      }
    };
  }, [fetchAll]);

  return useMemo(
    () => ({
      data,
      loading,
      error,
      refresh,
      lastUpdatedAt,
    }),
    [data, loading, error, refresh, lastUpdatedAt]
  );
}

// Individual hooks for specific data types
export function useLiveMatches(refreshInterval?: number) {
  const { data, loading, error, refresh, lastUpdatedAt } = useDashboardData();
  
  // Set up auto-refresh if interval is provided
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, refresh]);
  
  return {
    matches: data?.liveMatches || [],
    loading,
    error,
    refresh,
    lastUpdatedAt,
  };
}

export function usePredictions(refreshInterval?: number) {
  const { data, loading, error, refresh, lastUpdatedAt } = useDashboardData();
  
  // Set up auto-refresh if interval is provided
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, refresh]);
  
  return {
    predictions: data?.predictions || [],
    loading,
    error,
    refresh,
    lastUpdatedAt,
  };
}

export function useAgentStatus(refreshInterval?: number) {
  const { data, loading, error, refresh, lastUpdatedAt } = useDashboardData();
  
  // Set up auto-refresh if interval is provided
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, refresh]);
  
  return {
    agents: data?.agents || [],
    loading,
    error,
    refresh,
    lastUpdatedAt,
  };
}