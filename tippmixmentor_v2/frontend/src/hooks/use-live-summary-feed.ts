'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LiveSummaryService, type LiveSummaryData } from '@/lib/api/live-summary';

export interface UseLiveSummaryFeedResult {
  data: LiveSummaryData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdatedAt: number | null;
}

export function useLiveSummaryFeed(filter?: string, status?: string): UseLiveSummaryFeedResult {
  const [data, setData] = useState<LiveSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);

  const fetchLiveSummary = useCallback(async () => {
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
      const result = await LiveSummaryService.getLiveSummary(filter, status);
      setData(result);
      setLastUpdatedAt(result.lastUpdatedAt);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load live summary data';
      setError(msg);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [filter, status]);

  const refresh = useCallback(async () => {
    await fetchLiveSummary();
  }, [fetchLiveSummary]);

  useEffect(() => {
    fetchLiveSummary();
    
    // Set up auto-refresh every 30 seconds for live data
    const interval = setInterval(fetchLiveSummary, 30000);
    
    return () => {
      clearInterval(interval);
      try {
        abortRef.current?.abort();
      } catch {
        // no-op
      }
    };
  }, [fetchLiveSummary]);

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