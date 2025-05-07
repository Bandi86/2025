import HeroSectionComponent from '@/components/home/HeroSection'
import MovieCarouselSection from '@/components/home/MovieCarouselSection'
import { getMovies } from './helpers/getMovies'
import MediaItem from '@/types/MediaItem'
import ContinueWatch from '@/components/home/ContinueWatch'

export default async function Home() {
  const allMovies: MediaItem[] = await getMovies()

  // Legutóbb módosított (vagy hozzáadott) film/sorozat
  const heroItem =
    allMovies
      .filter((item) => item.modifiedAt)
      .sort((a, b) => new Date(b.modifiedAt!).getTime() - new Date(a.modifiedAt!).getTime())[0] ||
    allMovies[0]

  // Legújabb filmek (dátum szerint)
  const latestItems = allMovies
    .filter((item) => item.type === 'film' && item.modifiedAt)
    .sort((a, b) => new Date(b.modifiedAt!).getTime() - new Date(a.modifiedAt!).getTime())
    .slice(0, 5)

  // Legjobbra értékelt filmek (IMDb rating szerint)
  const topRatedItems = allMovies
    .filter(
      (item) => item.type === 'film' && item.omdb?.imdbRating && item.omdb.imdbRating !== 'N/A'
    )
    .sort((a, b) => parseFloat(b.omdb!.imdbRating) - parseFloat(a.omdb!.imdbRating))
    .slice(0, 5)

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <HeroSectionComponent movie={heroItem} />
      {/* <ContinueWatch movie={heroItem} /> */}

      <MovieCarouselSection title="Legújabb filmek" movies={latestItems} />
      <MovieCarouselSection title="Legjobbra értékelt filmek" movies={topRatedItems} />
    </div>
  )
}
