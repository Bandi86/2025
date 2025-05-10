import FilmekListazo from '@/components/filmek/FilmekListazo';

export default function FilmekPage() {
  // Az SWR-alapú FilmekListazo komponens már önállóan kezeli
  // az adatlekérést, hibaállapotokat és a betöltési folyamatot
  return <FilmekListazo />;
}
