import { useState, useEffect } from 'react';
import { Match } from '@/types/match';

export function useMatches(selectedDate?: string) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        let url = `${apiUrl}/api/matches`;
        if (selectedDate) {
          url += `?date=${selectedDate}`;
        } else {
          url += `?limit=100`;
        }
        const response = await fetch(url);
        const data = await response.json();
        if (Array.isArray(data?.data)) {
          setMatches(data.data);
        } else {
          setMatches([]);
        }
      } catch {
        setError("Nem sikerült betölteni a meccs adatokat.");
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [selectedDate]);

  return { matches, loading, error };
}
