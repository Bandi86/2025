'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MatchDetailService, type MatchDetail } from '@/lib/api/match-detail';

export interface UseMatchDetailResult {
  data: MatchDetail | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMatchDetail(matchId?: string): UseMatchDetailResult {
  const [data, setData] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);

  const fetchMatchDetail = useCallback(async (id: string) => {
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
      const result = await MatchDetailService.getMatchDetail(id);
      setData(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load match details';
      setError(msg);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (matchId) {
      await fetchMatchDetail(matchId);
    }
  }, [fetchMatchDetail, matchId]);

  useEffect(() => {
    if (matchId) {
      fetchMatchDetail(matchId);
    } else {
      setData(null);
      setError(null);
    }

    return () => {
      try {
        abortRef.current?.abort();
      } catch {
        // no-op
      }
    };
  }, [fetchMatchDetail, matchId]);

  return useMemo(
    () => ({
      data,
      loading,
      error,
      refresh,
    }),
    [data, loading, error, refresh]
  );
} 