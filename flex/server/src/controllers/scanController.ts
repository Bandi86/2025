import { RequestHandler } from 'express';
import { MediaFile, scanMediaDirectories } from '../scanner/mediaScanner';
import { saveMediaItems, saveOrUpdateOmdbMetadata } from '../db/mediaRepository';
import { addWatch } from '../watcher/mediaWatcher';
import generateTitleFromPath from '../helpers/generateTitleFromPath';
import * as dotenv from 'dotenv';
dotenv.config();

// NFO fájlból IMDb ID kinyerése
function extractImdbIdFromNfo(nfoContent: string): string | null {
  if (!nfoContent) return null;

  // IMDb azonosító kinyerése különböző formátumokban
  // pl. "tt1234567", "https://www.imdb.com/title/tt1234567/", stb.
  const imdbIdRegex =
    /(?:imdb\.com\/title\/|imdb:\/\/|imdb\s*[=:]\s*|imdb[Ii][dD][=:])?(tt\d{7,})/i;
  const match = nfoContent.match(imdbIdRegex);

  if (match) {
    console.log(`🎬 NFO-ból kinyert IMDb ID: ${match[1]}`);
  }

  return match ? match[1] : null;
}

// NFO fájlból cím kinyerése (ha nem találunk IMDb azonosítót)
function extractTitleFromNfo(nfoContent: string): string | null {
  if (!nfoContent) return null;

  // Különböző XML címkék, amelyek címet tartalmazhatnak
  const titleTags = [
    /<title>(.*?)<\/title>/i,
    /<originaltitle>(.*?)<\/originaltitle>/i,
    /<name>(.*?)<\/name>/i,
  ];

  for (const regex of titleTags) {
    const match = nfoContent.match(regex);
    if (match && match[1] && match[1].trim()) {
      console.log(`📝 NFO-ból kinyert cím: ${match[1].trim()} (regex: ${regex})`);
      return match[1].trim();
    }
  }

  // Naplózzuk, ha nincs találat egyik címkére sem
  console.log(
    `⚠️ NFO-ból nem sikerült címet kinyerni. NFO tartalom részlet: ${nfoContent.substring(
      0,
      100
    )}...`
  );
  return null;
}

async function getOmdbData(
  searchParam: string,
  searchType: 'title' | 'imdbId' = 'title'
): Promise<any> {
  try {
    const apiKey = process.env.OMDB_API_KEY?.trim();
    if (!apiKey) return null;

    // Kiválasztjuk a megfelelő keresési paramétert (cím vagy IMDb id)
    const searchQuery =
      searchType === 'imdbId'
        ? `i=${encodeURIComponent(searchParam)}`
        : `t=${encodeURIComponent(searchParam)}`;

    const url = `http://www.omdbapi.com/?apikey=${apiKey}&${searchQuery}`;
    console.log(
      `🔍 OMDb keresés: ${
        searchType === 'imdbId' ? 'IMDb azonosító' : 'Cím'
      } alapján - ${searchParam}`
    );

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { Response: string; [key: string]: any };
    if (data.Response === 'False') {
      console.log(`❌ OMDb API nem talált találatot: ${searchParam}`);
      return null;
    }

    console.log(`✅ OMDb API találat: ${data.Title} (${data.Year}), IMDb: ${data.imdbID}`);
    return data;
  } catch (error) {
    console.error('❌ Hiba az OMDb API hívása során:', error);
    return null;
  }
}

// SCAN the path
export const scanHandler: RequestHandler<any, any, { paths: string[] }> = async (req, res) => {
  const { paths } = req.body;

  if (!Array.isArray(paths) || paths.length === 0) {
    res.status(400).json({ error: 'Kérlek adj meg legalább egy elérési utat a "paths" mezőben.' });
    return;
  }

  try {
    const { files, errors } = await scanMediaDirectories(paths);

    // Filter out files containing the word 'sample'
    const filteredFiles: MediaFile[] = files.filter((file) => !file.path.includes('sample'));

    await saveMediaItems(filteredFiles);

    // OMDb metaadatok cache-elése minden új filmhez
    for (const file of filteredFiles) {
      if (file.type === 'film') {
        let omdb = null;

        // 1. Próbálkozás: NFO-ból IMDb ID kinyerése és azzal keresés
        if (file.nfoContent) {
          const imdbId = extractImdbIdFromNfo(file.nfoContent);
          if (imdbId) {
            omdb = await getOmdbData(imdbId, 'imdbId');
          }

          // 2. Próbálkozás: NFO-ból cím kinyerése és azzal keresés (ha IMDb ID nem hozott eredményt)
          if (!omdb) {
            const nfoTitle = extractTitleFromNfo(file.nfoContent);
            if (nfoTitle) {
              omdb = await getOmdbData(nfoTitle, 'title');
            }
          }
        }

        // 3. Próbálkozás: Fájlnévből generált cím (ha az előzőek nem hoztak eredményt)
        if (!omdb) {
          const title = generateTitleFromPath(file.path);
          omdb = await getOmdbData(title, 'title');
        }

        if (omdb) {
          if ('id' in file && typeof file.id === 'string') {
            // A régi updateMediaMetadata helyett az újat használjuk
            await saveOrUpdateOmdbMetadata(file.id, omdb);
            console.log(`✅ OMDb adatok mentve/frissítve: ${file.name} (ID: ${file.id})`);
          } else {
            console.warn(
              `File ${file.name} has an invalid or missing 'id' property. OMDb data not saved.`
            );
          }
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ error: errors.join(' | '), files: filteredFiles });
      return;
    }
    res.json({ files: filteredFiles });

    // Add watch for new directories
    filteredFiles.forEach((file) => {
      if (file.isNewDirectory) {
        addWatch(file.path);
      }
    });
  } catch (error) {
    console.error('Hiba a szkennelés során:', error);
    res.status(500).json({ error: 'Nem sikerült a mappák beolvasása.' });
  }
};
