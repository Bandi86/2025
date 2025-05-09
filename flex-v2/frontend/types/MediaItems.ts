// Alap típus
export interface MediaItemBase {
  id: string
  path: string
  name: string
  extension: string
  title: string
  type: 'film' | 'sorozat'
  size?: number
  modifiedAt?: Date
  isNewDirectory?: boolean
}

// Opcionális bővítmények
export interface MediaItemNfo {
  nfoContent: string
  linkedNfoPath: string
  linkedMediaPath: string
}

export interface MediaItemCover {
  cover_image_path: string
}

export interface MediaItemOmdb {
  omdb: {
    title: string
    year: string
    genre: string
    director: string
    actors: string
    plot: string
    imdbRating: string
    poster: string
  }
}

// Fő típus: kombinálható bővítményekkel
export type MediaItem =
  & MediaItemBase
  & Partial<MediaItemNfo>
  & Partial<MediaItemCover>
  & Partial<MediaItemOmdb>
