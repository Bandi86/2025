// NFO fájlból IMDb ID kinyerése
export function extractImdbIdFromNfo(nfoContent: string): string | null {
  if (!nfoContent) return null

  // IMDb azonosító kinyerése különböző formátumokban
  // pl. "tt1234567", "https://www.imdb.com/title/tt1234567/", stb.
  const imdbIdRegex = /(?:imdb\.com\/title\/|imdb:\/\/|imdb\s*[=:]\s*|imdb[Ii][dD][=:])?(tt\d{7,})/i
  const match = nfoContent.match(imdbIdRegex)

  if (match) {
    console.log(`🎬 NFO-ból kinyert IMDb ID: ${match[1]}`)
  }

  return match ? match[1] : null
}
