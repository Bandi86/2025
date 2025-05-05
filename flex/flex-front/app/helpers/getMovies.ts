import MediaItem from "@/types/MediaItem";

export async function getMovies(): Promise<MediaItem[]> {
  const res = await fetch('http://localhost:8000/api/filmek', { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.movies || [];
}
