#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

class FullResetAndReload {
  private jsonDir: string;

  constructor() {
    this.jsonDir = path.resolve(
      __dirname,
      '../../ml_pipeline/betting_extractor/jsons/processed',
    );
  }

  async run(): Promise<void> {
    console.log('🔄 TELJES RESET ÉS ÚJRATÖLTÉS KEZDETE...\n');

    try {
      // 1. Database reset
      await this.resetDatabase();

      // 2. Wait for database to be ready
      await this.waitForDatabase();

      // 3. Import all JSON files
      await this.importAllJsonFiles();

      // 4. Run validation
      await this.runValidation();

      console.log('\n✅ TELJES RESET ÉS ÚJRATÖLTÉS BEFEJEZVE!');
    } catch (error) {
      console.error('❌ Hiba történt:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  private async resetDatabase(): Promise<void> {
    console.log('🗄️ 1. ADATBÁZIS RESET...');

    try {
      // Reset database using Prisma
      console.log('  - Prisma migrate reset futtatása...');
      execSync('npx prisma migrate reset --force', {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..'),
      });

      console.log('  ✅ Adatbázis sikeresen resetelve\n');
    } catch (error) {
      console.error('  ❌ Adatbázis reset hiba:', error);
      throw error;
    }
  }

  private async waitForDatabase(): Promise<void> {
    console.log('⏳ 2. ADATBÁZIS ELÉRHETŐSÉG ELLENŐRZÉSE...');

    let retries = 10;
    while (retries > 0) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('  ✅ Adatbázis elérhető\n');
        return;
      } catch (error) {
        console.log(
          `  ⏳ Várakozás az adatbázisra... (${retries} próbálkozás maradt)`,
        );
        retries--;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    throw new Error('Adatbázis nem érhető el a reset után');
  }

  private async importAllJsonFiles(): Promise<void> {
    console.log('📁 3. ÖSSZES JSON FÁJL IMPORTÁLÁSA...');

    if (!fs.existsSync(this.jsonDir)) {
      console.log(`  ❌ JSON könyvtár nem található: ${this.jsonDir}`);
      return;
    }

    const files = fs
      .readdirSync(this.jsonDir)
      .filter((f) => f.endsWith('.json'))
      .sort(); // Rendezzük a fájlokat a konzisztens importálás érdekében

    console.log(`  📊 ${files.length} JSON fájl találva`);

    for (const file of files) {
      console.log(`  📄 Importálás: ${file}`);

      try {
        const filePath = path.join(this.jsonDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        if (data.matches && data.matches.length > 0) {
          // Használjuk a meglévő JSON importer service-t
          await this.importJsonData(data, file);
          console.log(`    ✅ ${data.matches.length} meccs importálva`);
        } else {
          console.log(`    ⚠️  Nincs meccs a fájlban`);
        }
      } catch (error) {
        console.log(`    ❌ Hiba az importálás során: ${error.message}`);
      }
    }

    console.log('\n  📊 IMPORT ÖSSZEFOGLALÓ:');
    const totalMatches = await prisma.match.count();
    const totalTeams = await prisma.team.count();
    const totalCompetitions = await prisma.competition.count();
    const totalMarkets = await prisma.market.count();

    console.log(`    - Meccsek: ${totalMatches}`);
    console.log(`    - Csapatok: ${totalTeams}`);
    console.log(`    - Bajnokságok: ${totalCompetitions}`);
    console.log(`    - Piacok: ${totalMarkets}\n`);
  }

  private async importJsonData(data: any, filename: string): Promise<void> {
    // Egyszerű import logika - hasonló a json-importer.service.ts-hez
    for (const match of data.matches) {
      try {
        if (!match.team1 || !match.team2 || !match.league) {
          continue; // Kihagyjuk az érvénytelen meccseket
        }

        // Ellenőrizzük, hogy érvényes-e a meccs
        if (this.isInvalidMatch(match)) {
          continue;
        }

        // Csapatok létrehozása/keresése
        const homeTeam = await this.findOrCreateTeam(match.team1);
        const awayTeam = await this.findOrCreateTeam(match.team2);

        // Bajnokság létrehozása/keresése
        const competition = await this.findOrCreateCompetition(match.league);

        // Dátum parsing
        const matchDate = this.parseDate(match.date, match.time);

        // Duplikátum ellenőrzés
        const existingMatch = await prisma.match.findFirst({
          where: {
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            competitionId: competition.id,
            date: matchDate,
          },
        });

        if (existingMatch) {
          continue; // Kihagyjuk a duplikátumokat
        }

        // Meccs ID generálása (ugyanaz a logika mint a JsonImporterService-ben)
        const matchId =
          `${match.date}_${homeTeam.id}_${awayTeam.id}_${competition.id}`.replace(
            /[^a-zA-Z0-9_]/g,
            '',
          );

        // Meccs létrehozása
        const newMatch = await prisma.match.create({
          data: {
            id: matchId, // Explicit ID megadása
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            competitionId: competition.id,
            date: matchDate,
            season: '2025',
            sourceType: 'PDF_EXTRACTION',
            sourcePath: filename,
          },
        });

        // Piacok importálása
        if (match.markets && match.markets.length > 0) {
          for (const market of match.markets) {
            await this.importMarket(newMatch.id, market);
          }
        }
      } catch (error) {
        console.log(`    ⚠️  Hiba a meccs importálásánál: ${error.message}`);
      }
    }
  }

  private async findOrCreateTeam(name: string): Promise<{ id: string }> {
    const normalizedName = name.toLowerCase().trim();

    let team = await prisma.team.findFirst({
      where: { name: normalizedName },
    });

    if (!team) {
      team = await prisma.team.create({
        data: {
          name: normalizedName,
          fullName: name,
          country: 'Unknown',
        },
      });
    }

    return team;
  }

  private async findOrCreateCompetition(name: string): Promise<{ id: string }> {
    const normalizedName = name.trim();

    let competition = await prisma.competition.findFirst({
      where: { name: normalizedName },
    });

    if (!competition) {
      competition = await prisma.competition.create({
        data: {
          name: normalizedName,
          country: 'Unknown',
          type: 'LEAGUE',
          season: '2025',
        },
      });
    }

    return competition;
  }

  private parseDate(dateStr: string, timeStr?: string): Date {
    try {
      if (!dateStr) {
        return new Date(); // Default to current date
      }

      // Ha a dátum formátuma YYYY-MM-DD
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(dateStr);

        // Ha van idő is, adjuk hozzá
        if (timeStr && timeStr.match(/^([01]?\d|2[0-3]):[0-5]\d$/)) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          date.setHours(hours, minutes, 0, 0);
        }

        return date;
      }

      // Fallback: probáljuk meg közvetlenül parse-olni
      return new Date(dateStr);
    } catch (error) {
      console.log(`    ⚠️  Dátum parse hiba: ${dateStr}, ${timeStr}`);
      return new Date(); // Default to current date
    }
  }

  private async importMarket(matchId: string, market: any): Promise<void> {
    try {
      if (!market.name) {
        return;
      }

      // Create the market first
      const newMarket = await prisma.market.create({
        data: {
          matchId: matchId,
          name: market.name,
          origName: market.orig_market || null,
        },
      });

      // Then create odds for this market
      const odds: { marketId: string; type: string; value: number }[] = [];

      if (market.odds1) {
        odds.push({
          marketId: newMarket.id,
          type: 'odds1',
          value: parseFloat(market.odds1),
        });
      }

      if (market.oddsX) {
        odds.push({
          marketId: newMarket.id,
          type: 'oddsX',
          value: parseFloat(market.oddsX),
        });
      }

      if (market.odds2) {
        odds.push({
          marketId: newMarket.id,
          type: 'odds2',
          value: parseFloat(market.odds2),
        });
      }

      // Create all odds at once
      if (odds.length > 0) {
        await prisma.odds.createMany({
          data: odds,
        });
      }
    } catch (error) {
      console.log(`    ⚠️  Piac import hiba: ${error.message}`);
    }
  }

  private isInvalidMatch(match: any): boolean {
    const invalidTerms = [
      'kaput eltalalo',
      'kapura tarto',
      'kezdo',
      'golszerzesi',
      'vs',
      'pontszam',
      'eredmeny',
      'kártya',
      'szöglet',
    ];

    const team1 = match.team1?.toLowerCase() || '';
    const team2 = match.team2?.toLowerCase() || '';

    return invalidTerms.some(
      (term) => team1.includes(term) || team2.includes(term),
    );
  }

  private async runValidation(): Promise<void> {
    console.log('🔍 4. VALIDÁCIÓS ELLENŐRZÉS FUTTATÁSA...');

    try {
      // TODO: Validáció átmenetileg letiltva a modul átszervezés miatt
      console.log('  ⚠️  Validáció átmenetileg letiltva');
      /*
      // Importáljuk és futtatjuk a comprehensive validator-t
      const { ComprehensiveDataValidator } = await import(
        '../active/comprehensive-data-validator'
      );
      const validator = new ComprehensiveDataValidator();

      await validator.runFullValidation();
      */
    } catch (error) {
      console.log(`  ❌ Validáció hiba: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  const resetAndReload = new FullResetAndReload();

  try {
    await resetAndReload.run();
  } catch (error) {
    console.error('❌ HIBA TÖRTÉNT:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { FullResetAndReload };
