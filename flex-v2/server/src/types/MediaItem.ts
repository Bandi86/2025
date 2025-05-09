export interface MediaItem {
  id: string
  name: string
  path: string
  extension: string
  size?: number
  created_at?: string
  modified_at?: string | null
  type: 'film' | 'sorozat'
  cover_image_path?: string | null
  scanned_by_user_id?: string | null
}

export interface OmdbMetadata {
  media_item_id: string
  title?: string
  year?: string
  genre?: string
  director?: string
  actors?: string
  plot?: string
  imdb_rating?: string
  poster_url?: string
  api_response?: string
}

export interface MediaItemWithOmdb extends MediaItem {
  omdb?: OmdbMetadata
}

export interface MediaItemWithNfo extends MediaItem {
  nfoContent: string
  linkedNfoPath: string
  linkedMediaPath: string
}

export interface UserMediaStatus {
  user_id: string
  media_item_id: string
  current_time_seconds?: number
  total_duration_seconds?: number | null
  is_completed?: boolean
  last_updated_at?: string
}
