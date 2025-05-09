import * as dotenv from 'dotenv'
dotenv.config()

export async function getOmdbData(
  searchParam: string,
  searchType: 'title' | 'imdbId' = 'title'
): Promise<any> {
  try {
    const apiKey = process.env.OMDB_API_KEY?.trim()
    if (!apiKey) return null

    // Kiválasztjuk a megfelelő keresési paramétert (cím vagy IMDb id)
    const searchQuery =
      searchType === 'imdbId'
        ? `i=${encodeURIComponent(searchParam)}`
        : `t=${encodeURIComponent(searchParam)}`

    const url = `http://www.omdbapi.com/?apikey=${apiKey}&${searchQuery}`
    console.log(
      `🔍 OMDb keresés: ${
        searchType === 'imdbId' ? 'IMDb azonosító' : 'Cím'
      } alapján - ${searchParam}`
    )

    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as { Response: string; [key: string]: any }
    if (data.Response === 'False') {
      console.log(`❌ OMDb API nem talált találatot: ${searchParam}`)
      return null
    }

    console.log(`✅ OMDb API találat: ${data.Title} (${data.Year}), IMDb: ${data.imdbID}`)
    return data
  } catch (error) {
    console.error('❌ Hiba az OMDb API hívása során:', error)
    return null
  }
}
