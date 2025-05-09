import User from '../../../frontend/types/User'
import { MediaItem, OmdbMetadata, UserMediaStatus } from './MediaItem'

export interface DbSchema {
  users: User
  media_items: MediaItem
  omdb_metadata: OmdbMetadata
  user_media_status: UserMediaStatus
}
