export default interface MediaItem {
  id: string;
  path: string;
  name: string;
  extension: string;
  title: string;
  size?: number;
  modifiedAt?: Date;
  isNewDirectory?: boolean;
  type: 'film' | 'sorozat';
  nfoContent?: string;
  linkedNfoPath?: string; // Az NFO fájl elérési útja, ha van
  linkedMediaPath?: string; // A médiafájl elérési útja, ha ez egy NFO rekord
  cover_image_path?: string; // Új mező a borítóképhez
  omdb?: {
    title: string;
    year: string;
    genre: string;
    director: string;
    actors: string;
    plot: string;
    imdbRating: string;
    poster: string; // Az OMDb adatainak poster URL-je
  };
}
