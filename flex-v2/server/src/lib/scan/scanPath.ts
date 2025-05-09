import * as fs from 'fs/promises'
import * as path from 'path'
import { extractImdbIdFromNfo } from './imdbidFromNfo'
import { getOmdbData } from './getOmdbData'
import {
  upsertMediaItem,
  upsertOmdbMetadata,
  getMediaItemByPath
} from '../../repositories/mediaRepository'

import { MediaItem, OmdbMetadata } from '../../types/MediaItem'

const SUPPORTED_VIDEO_EXTENSIONS = ['.mkv', '.mp4', '.avi', '.mov', '.wmv', '.flv']
const NFO_EXTENSION = '.nfo'

export interface ScanResult {
  filePath: string
  status:
    | 'added'
    | 'updated'
    | 'exists'
    | 'error'
    | 'nfo_missing'
    | 'omdb_not_found'
    | 'skipped_unsupported'
  message?: string
  mediaItemId?: string
}

async function processMediaFile(filePath: string, userId: string): Promise<ScanResult> {
  try {
    const dirname = path.dirname(filePath)
    const basename = path.basename(filePath)
    const ext = path.extname(basename).toLowerCase()
    const nameWithoutExt = path.basename(basename, path.extname(basename))

    const existingMediaItem = await getMediaItemByPath(filePath)

    const stats = await fs.stat(filePath)

    let imdbId: string | null = null
    const nfoFilePath = path.join(dirname, nameWithoutExt + NFO_EXTENSION)
    let nfoFound = false

    try {
      const nfoContent = await fs.readFile(nfoFilePath, 'utf-8')
      imdbId = extractImdbIdFromNfo(nfoContent)
      nfoFound = true
      console.log(`NFO found for ${basename}, IMDb ID: ${imdbId}`)
    } catch (nfoError) {
      console.log(`NFO file not found or error reading for ${basename}.`)
    }

    let omdbApiResponse: any = null
    if (imdbId) {
      omdbApiResponse = await getOmdbData(imdbId, 'imdbId')
    }
    if (!omdbApiResponse) {
      const cleanedTitle = nameWithoutExt.replace(/[._]/g, ' ').replace(/\s+/g, ' ').trim()
      console.log(`Attempting OMDb search by title: ${cleanedTitle}`)
      omdbApiResponse = await getOmdbData(cleanedTitle, 'title')
    }

    if (!omdbApiResponse || omdbApiResponse.Response === 'False') {
      return {
        filePath,
        status: 'omdb_not_found',
        message: `OMDb data not found for ${nameWithoutExt}. NFO found: ${nfoFound}, IMDb ID from NFO: ${imdbId || 'N/A'}`
      }
    }

    const mediaItemData: Partial<Omit<MediaItem, 'id' | 'created_at' | 'modified_at'>> & {
      path: string
      scanned_by_user_id: string
    } = {
      name: omdbApiResponse.Title || nameWithoutExt,
      path: filePath,
      extension: ext,
      size: stats.size,
      type: omdbApiResponse.Type === 'series' ? 'sorozat' : 'film',
      cover_image_path:
        omdbApiResponse.Poster && omdbApiResponse.Poster !== 'N/A' ? omdbApiResponse.Poster : null,
      scanned_by_user_id: userId
    }

    const mediaItemId = await upsertMediaItem(mediaItemData)
    const currentStatus: ScanResult['status'] = existingMediaItem ? 'updated' : 'added'

    if (mediaItemId && omdbApiResponse) {
      const omdbMetadataPayload: Partial<OmdbMetadata> = {
        title: omdbApiResponse.Title,
        year: omdbApiResponse.Year,
        genre: omdbApiResponse.Genre,
        director: omdbApiResponse.Director,
        actors: omdbApiResponse.Actors,
        plot: omdbApiResponse.Plot,
        imdb_rating: omdbApiResponse.imdbRating,
        poster_url:
          omdbApiResponse.Poster && omdbApiResponse.Poster !== 'N/A'
            ? omdbApiResponse.Poster
            : null,
        api_response: JSON.stringify(omdbApiResponse)
      }
      await upsertOmdbMetadata(mediaItemId, omdbMetadataPayload)
    }

    return { filePath, status: currentStatus, mediaItemId }
  } catch (error: any) {
    console.error(`Error processing file ${filePath}:`, error)
    return { filePath, status: 'error', message: error.message }
  }
}

async function scanDirectory(directoryPath: string, userId: string): Promise<ScanResult[]> {
  const results: ScanResult[] = []
  try {
    const dirents = await fs.readdir(directoryPath, { withFileTypes: true })
    for (const dirent of dirents) {
      const fullPath = path.join(directoryPath, dirent.name)
      if (dirent.isDirectory()) {
        results.push(...(await scanDirectory(fullPath, userId)))
      } else if (dirent.isFile()) {
        const ext = path.extname(dirent.name).toLowerCase()
        if (SUPPORTED_VIDEO_EXTENSIONS.includes(ext)) {
          results.push(await processMediaFile(fullPath, userId))
        } else {
          // Optionally log skipped files:
          // console.log(`Skipping unsupported file type: ${fullPath}`);
          // results.push({ filePath: fullPath, status: 'skipped_unsupported', message: 'File type not supported.' });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${directoryPath}:`, error)
    results.push({
      filePath: directoryPath,
      status: 'error',
      message: `Failed to scan directory: ${(error as Error).message}`
    })
  }
  return results
}

export async function scanPaths(pathsToScan: string[], userId: string): Promise<ScanResult[]> {
  let allResults: ScanResult[] = []
  for (const p of pathsToScan) {
    try {
      const stats = await fs.stat(p)
      if (stats.isDirectory()) {
        console.log(`Scanning directory: ${p}`)
        allResults.push(...(await scanDirectory(p, userId)))
      } else if (stats.isFile()) {
        const ext = path.extname(p).toLowerCase()
        if (SUPPORTED_VIDEO_EXTENSIONS.includes(ext)) {
          console.log(`Scanning file: ${p}`)
          allResults.push(await processMediaFile(p, userId))
        } else {
          allResults.push({
            filePath: p,
            status: 'skipped_unsupported',
            message: 'File type not supported.'
          })
        }
      } else {
        allResults.push({
          filePath: p,
          status: 'error',
          message: 'Path is not a supported file or directory.'
        })
      }
    } catch (error) {
      console.error(`Error accessing path ${p}:`, error)
      allResults.push({
        filePath: p,
        status: 'error',
        message: `Error accessing path: ${(error as Error).message}`
      })
    }
  }
  console.log(`Scan completed. Total items processed: ${allResults.length}`)
  return allResults
}
