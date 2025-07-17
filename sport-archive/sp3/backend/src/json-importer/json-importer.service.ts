import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MatchStatus, DataSource } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { watch } from 'fs';

export interface ImportResult {
  success: boolean;
  message: string;
  processedFiles: number;
  importedMatches: number;
  errors: string[];
}

@Injectable()
export class JsonImporterService {
  private readonly logger = new Logger(JsonImporterService.name);
  private readonly JSON_DIR = path.resolve(
    __dirname,
    '../../../../ml_pipeline/betting_extractor/jsons',
  );
  private readonly PROCESSED_DIR = path.join(this.JSON_DIR, 'processed');
  private isWatching = false;
  private processedFiles = new Set<string>();

  constructor(private prisma: PrismaService) {
    // Processed mappa létrehozása ha nem létezik
    this.ensureProcessedDir();
  }

  private async ensureProcessedDir(): Promise<void> {
    try {
      await fs.promises.access(this.PROCESSED_DIR);
    } catch {
      await fs.promises.mkdir(this.PROCESSED_DIR, { recursive: true });
      this.logger.log(`Processed directory created: ${this.PROCESSED_DIR}`);
    }
  }

  /**
   * Automatikus JSON figyelő indítása
   */
  async startWatching(): Promise<void> {
    if (this.isWatching) {
      this.logger.warn('JSON watcher is already running');
      return;
    }

    this.logger.log(`🔄 JSON watcher indítása: ${this.JSON_DIR}`);

    // Először feldolgozzuk a meglévő fájlokat
    await this.processExistingFiles();

    // Majd elindítjuk a file watchert
    this.isWatching = true;

    const watcher = watch(
      this.JSON_DIR,
      { persistent: true },
      async (eventType, filename) => {
        if (
          !filename ||
          !filename.endsWith('.json') ||
          filename.startsWith('.')
        ) {
          return;
        }

        if (eventType === 'rename' || eventType === 'change') {
          const filePath = path.join(this.JSON_DIR, filename);

          // Ellenőrizzük hogy a fájl létezik és olvasható
          try {
            await fs.promises.access(filePath, fs.constants.R_OK);

            // Kis várakozás hogy a fájl teljesen beírásra kerüljön
            setTimeout(async () => {
              await this.processJsonFile(filePath);
            }, 1000);
          } catch (err) {
            // Fájl nem elérhető (törölve vagy átmozgatva)
            this.logger.debug(`File not accessible: ${filename}`);
          }
        }
      },
    );

    this.logger.log('✅ JSON watcher elindult, várakozás új JSON fájlokra...');
  }

  /**
   * Watcher leállítása
   */
  stopWatching(): void {
    this.isWatching = false;
    this.logger.log('🛑 JSON watcher leállítva');
  }

  /**
   * Meglévő JSON fájlok feldolgozása
   */
  private async processExistingFiles(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.JSON_DIR);
      const jsonFiles = files.filter(
        (f) => f.endsWith('.json') && !f.startsWith('.'),
      );

      this.logger.log(`📂 ${jsonFiles.length} meglévő JSON fájl találva`);

      for (const file of jsonFiles) {
        const filePath = path.join(this.JSON_DIR, file);
        await this.processJsonFile(filePath);
      }
    } catch (error) {
      this.logger.error('Hiba a meglévő fájlok feldolgozásakor:', error);
    }
  }

  /**
   * Egyetlen JSON fájl feldolgozása
   */
  private async processJsonFile(filePath: string): Promise<void> {
    const filename = path.basename(filePath);

    // Ellenőrizzük hogy már feldolgoztuk-e
    if (this.processedFiles.has(filename)) {
      return;
    }

    try {
      this.logger.log(`🔄 JSON feldolgozása: ${filename}`);

      const data = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));

      if (!data.matches || !Array.isArray(data.matches)) {
        this.logger.warn(`Nincs matches tömb a fájlban: ${filename}`);
        return;
      }

      let importedMatches = 0;
      const errors: string[] = [];

      for (const match of data.matches) {
        try {
          await this.importSingleMatch(match);
          importedMatches++;
        } catch (error) {
          const errorMsg = `Hiba a meccs importálásakor (${match.team1} vs ${match.team2}): ${error.message}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      // Fájl áthelyezése a processed mappába
      const processedPath = path.join(this.PROCESSED_DIR, filename);
      await fs.promises.rename(filePath, processedPath);

      this.processedFiles.add(filename);

      this.logger.log(
        `✅ Sikeres import: ${filename} - ${importedMatches} meccs importálva`,
      );

      if (errors.length > 0) {
        this.logger.warn(
          `⚠️  ${errors.length} hiba történt a feldolgozás során`,
        );
      }
    } catch (error) {
      this.logger.error(`❌ Hiba a JSON feldolgozásakor (${filename}):`, error);
    }
  }

  /**
   * Egyetlen meccs importálása
   */
  private async importSingleMatch(match: any): Promise<void> {
    // 1. Competition keresés/létrehozás
    let competition = await this.prisma.competition.findFirst({
      where: { name: match.league },
    });
    if (!competition) {
      competition = await this.prisma.competition.create({
        data: {
          name: match.league,
          season:
            match.date?.slice(0, 4) +
            '/' +
            (parseInt(match.date?.slice(0, 4)) + 1),
          country: 'Unknown',
        },
      });
    }

    // 2. Team keresés/létrehozás (mindkét csapat)
    let team1 = await this.prisma.team.findFirst({
      where: { name: match.team1 },
    });
    if (!team1) {
      team1 = await this.prisma.team.create({
        data: { name: match.team1, fullName: match.team1, country: 'Unknown' },
      });
    }
    let team2 = await this.prisma.team.findFirst({
      where: { name: match.team2 },
    });
    if (!team2) {
      team2 = await this.prisma.team.create({
        data: { name: match.team2, fullName: match.team2, country: 'Unknown' },
      });
    }

    // 3. Match upsert (egyedi kulcs: date, homeTeamId, awayTeamId, competitionId)
    const matchId =
      `${match.date}_${team1.id}_${team2.id}_${competition.id}`.replace(
        /[^a-zA-Z0-9_]/g,
        '',
      );

    let matchRecord = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!matchRecord) {
      // Dátum létrehozása és validálása (de nem blokkoljuk az importot)
      const matchDate = new Date(`${match.date}T${match.time}`);
      const today = new Date();
      const maxFutureDate = new Date(today);
      maxFutureDate.setDate(maxFutureDate.getDate() + 6);
      const minPastDate = new Date(today);
      minPastDate.setDate(minPastDate.getDate() - 30); // 30 napnál régebbi meccsek is gyanúsak

      // Gyanús dátumok logolása (de importálás folytatása)
      if (matchDate > maxFutureDate) {
        this.logger.warn(
          `🔍 GYANÚS: Túl távoli jövőbeli meccs: ${match.team1} vs ${match.team2} (${match.date}) - ${Math.ceil((matchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} nap előre`,
        );
      }
      if (matchDate < minPastDate) {
        this.logger.warn(
          `🔍 GYANÚS: Túl régi meccs: ${match.team1} vs ${match.team2} (${match.date}) - ${Math.ceil((today.getTime() - matchDate.getTime()) / (1000 * 60 * 60 * 24))} nap régi`,
        );
      }
      if (isNaN(matchDate.getTime())) {
        this.logger.error(
          `❌ ÉRVÉNYTELEN DÁTUM: ${match.team1} vs ${match.team2} (${match.date}T${match.time})`,
        );
        return; // Csak az érvénytelen dátumokat hagyjuk ki
      }

      matchRecord = await this.prisma.match.create({
        data: {
          id: matchId,
          date: matchDate,
          homeTeamId: team1.id,
          awayTeamId: team2.id,
          competitionId: competition.id,
          season: competition.season,
          status: MatchStatus.SCHEDULED,
          sourceType: DataSource.PDF_EXTRACTION,
        },
      });
    }

    // 4. Intelligens market merge (csak akkor frissítünk, ha jobb verzió érkezett)
    await this.intelligentMarketMerge(
      matchRecord.id,
      match.markets,
      match.team1,
      match.team2,
    );
  }

  /**
   * Manuális import egy adott könyvtárból
   */
  async importJsonFiles(directory?: string): Promise<ImportResult> {
    const targetDir = directory || this.JSON_DIR;

    try {
      const files = await fs.promises.readdir(targetDir);
      const jsonFiles = files.filter(
        (f) => f.endsWith('.json') && !f.startsWith('.'),
      );

      this.logger.log(
        `📂 ${jsonFiles.length} JSON fájl feldolgozása: ${targetDir}`,
      );

      let importedMatches = 0;
      const errors: string[] = [];

      for (const file of jsonFiles) {
        const filePath = path.join(targetDir, file);

        try {
          const data = JSON.parse(
            await fs.promises.readFile(filePath, 'utf-8'),
          );

          if (data.matches && Array.isArray(data.matches)) {
            for (const match of data.matches) {
              try {
                await this.importSingleMatch(match);
                importedMatches++;
              } catch (error) {
                errors.push(`${file}: ${error.message}`);
              }
            }
          }
        } catch (error) {
          errors.push(`${file}: ${error.message}`);
        }
      }

      return {
        success: true,
        message: `Sikeres import: ${jsonFiles.length} fájl, ${importedMatches} meccs`,
        processedFiles: jsonFiles.length,
        importedMatches,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        message: `Import hiba: ${error.message}`,
        processedFiles: 0,
        importedMatches: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * JSON import statisztikák
   */
  async getImportStats(): Promise<any> {
    const totalMatches = await this.prisma.match.count({
      where: { sourceType: DataSource.PDF_EXTRACTION },
    });

    const totalCompetitions = await this.prisma.competition.count();
    const totalTeams = await this.prisma.team.count();

    return {
      totalMatches,
      totalCompetitions,
      totalTeams,
      processedFiles: this.processedFiles.size,
      isWatching: this.isWatching,
      jsonDirectory: this.JSON_DIR,
      processedDirectory: this.PROCESSED_DIR,
    };
  }

  /**
   * Intelligens market merge - csak akkor frissít, ha jobb verzió érkezett
   */
  private async intelligentMarketMerge(
    matchId: string,
    newMarkets: any[],
    team1: string,
    team2: string,
  ): Promise<void> {
    // Meglévő markets lekérése
    const existingMarkets = await this.prisma.market.findMany({
      where: { matchId },
      include: { odds: true },
    });

    const existingMarketsCount = existingMarkets.length;
    const newMarketsCount = newMarkets.length;
    const existingOddsCount = existingMarkets.reduce(
      (sum, m) => sum + m.odds.length,
      0,
    );
    const newOddsCount = newMarkets.reduce(
      (sum, m) =>
        sum + (m.odds1 ? 1 : 0) + (m.oddsX ? 1 : 0) + (m.odds2 ? 1 : 0),
      0,
    );

    this.logger.log(
      `🔄 Market merge decision for ${team1} vs ${team2}: ${existingMarketsCount} → ${newMarketsCount} markets, ${existingOddsCount} → ${newOddsCount} odds`,
    );

    // Merge döntési logika
    let shouldUpdate = false;
    let reason = '';

    if (existingMarketsCount === 0) {
      // Új meccs - mindig importáljuk
      shouldUpdate = true;
      reason = 'új meccs';
    } else if (newMarketsCount > existingMarketsCount) {
      // Több piac érkezett - frissítés
      shouldUpdate = true;
      reason = `több piac (${existingMarketsCount} → ${newMarketsCount})`;
    } else if (
      newMarketsCount === existingMarketsCount &&
      newOddsCount > existingOddsCount
    ) {
      // Azonos piacszám, de több odds - frissítés
      shouldUpdate = true;
      reason = `több odds (${existingOddsCount} → ${newOddsCount})`;
    } else {
      // Nem frissítünk - megtartjuk a jobbat
      shouldUpdate = false;
      reason = `megtartás (jelenlegi: ${existingMarketsCount} piac, ${existingOddsCount} odds >= új: ${newMarketsCount} piac, ${newOddsCount} odds)`;
    }

    if (shouldUpdate) {
      this.logger.log(`✅ Market frissítés: ${reason}`);

      // Régi markets törlése
      const marketIds = existingMarkets.map((m) => m.id);
      if (marketIds.length > 0) {
        await this.prisma.odds.deleteMany({
          where: { marketId: { in: marketIds } },
        });
        await this.prisma.market.deleteMany({ where: { matchId } });
      }

      // Új markets létrehozása
      await this.createMarkets(matchId, newMarkets);
    } else {
      this.logger.log(`⏭️ Market megtartás: ${reason}`);
    }
  }

  /**
   * Markets létrehozása
   */
  private async createMarkets(matchId: string, markets: any[]): Promise<void> {
    for (const market of markets) {
      const createdMarket = await this.prisma.market.create({
        data: {
          matchId: matchId,
          name: market.name,
          origName: market.orig_market,
        },
      });

      // Odds rekordok létrehozása a markethez
      if (market.odds1) {
        await this.prisma.odds.create({
          data: {
            marketId: createdMarket.id,
            type: 'odds1',
            value: parseFloat(market.odds1),
          },
        });
      }

      if (market.oddsX) {
        await this.prisma.odds.create({
          data: {
            marketId: createdMarket.id,
            type: 'oddsX',
            value: parseFloat(market.oddsX),
          },
        });
      }

      if (market.odds2) {
        await this.prisma.odds.create({
          data: {
            marketId: createdMarket.id,
            type: 'odds2',
            value: parseFloat(market.odds2),
          },
        });
      }
    }
  }
}
