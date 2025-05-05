import MediaItem from "@/types/MediaItem";

export async function getMovieItem(id: string): Promise<MediaItem | null> {
  const res = await fetch(`http://localhost:8000/api/filmek`, { cache: 'no-store' })
  const data = await res.json()
  const item = data.movies.find((m: MediaItem) => String(m.id) === id)
  return item || null
}
