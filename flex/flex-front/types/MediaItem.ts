export default interface MediaItem {
  id: number
  name: string
  extension: string
  size: number
  coverUrl: string
  title: string
  description: string
  omdb: {
    title: string
    year: string
    rated: string
    released: string
    runtime: string
    genre: string
    director: string
    writer: string
    actors: string
    plot: string
    language: string
    country: string
    awards: string
    poster: string
    ratings: [
      {
        source: string
        value: string
      }
    ]
    metascore: string
    imdbRating: string
    imdbVotes: string
    imdbID: string
    type: string
    DVD: string
    boxOffice: string
    production: string
    website: string
    response: string}
}
