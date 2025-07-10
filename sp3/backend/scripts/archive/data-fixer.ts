#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

class DataFixer {
  async fixAll(): Promise<void> {
    console.log('🔧 Adatjavítás elkezdve...\n');

    try {
      await this.fixDuplicateTeams();
      await this.reimportCleanData();
      await this.updateMatchTimes();

      console.log('\n✅ Adatjavítás befejezve!');
    } catch (error) {
      console.error('❌ Hiba történt:', error);
      throw error;
    }
  }

  async fixDuplicateTeams(): Promise<void> {
    console.log('🔧 1. Duplikált csapatok javítása...');

    // Find duplicate team names
    const duplicateTeamNames = (await prisma.$queryRaw`
      SELECT name, array_agg(id) as ids, COUNT(*) as count
      FROM teams
      GROUP BY name
      HAVING COUNT(*) > 1
    `) as any[];

    for (const duplicate of duplicateTeamNames) {
      console.log(
        `  Duplikált csapat: ${duplicate.name} (${duplicate.count} db)`,
      );

      // Keep the first team, merge others
      const keepId = duplicate.ids[0];
      const mergeIds = duplicate.ids.slice(1);

      for (const mergeId of mergeIds) {
        // Update home matches
        await prisma.match.updateMany({
          where: { homeTeamId: mergeId },
          data: { homeTeamId: keepId },
        });

        // Update away matches
        await prisma.match.updateMany({
          where: { awayTeamId: mergeId },
          data: { awayTeamId: keepId },
        });

        // Delete the duplicate team
        await prisma.team.delete({
          where: { id: mergeId },
        });
      }

      console.log(`    ✅ Egyesítve: ${duplicate.name}`);
    }
  }

  async reimportCleanData(): Promise<void> {
    console.log('🔧 2. Tiszta adatok újraimportálása...');

    // Clear existing data
    await prisma.market.deleteMany({});
    await prisma.match.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.competition.deleteMany({});

    console.log('  ✅ Adatok törölve');

    // Import only the latest JSON file (to avoid duplicates)
    const jsonDir = path.resolve(
      __dirname,
      '../../ml_pipeline/betting_extractor/jsons/processed',
    );
    const files = fs
      .readdirSync(jsonDir)
      .filter((f) => f.endsWith('.json') && !f.includes('test'));

    // Sort files and take only the latest one
    const latestFile = files.sort().pop();

    if (!latestFile) {
      console.log('  ❌ Nincs importálható JSON fájl');
      return;
    }

    console.log(`  📁 Importálás: ${latestFile}`);

    // Here you would call your existing import logic
    // For now, let's just log what we would do
    console.log('  🔄 JSON import szolgáltatás indítása...');

    // Trigger the import service
    try {
      const { exec } = require('child_process');
      await new Promise((resolve, reject) => {
        exec(
          'cd /home/bandi/Documents/code/2025/sp3 && docker-compose exec backend npm run import-json',
          (error, stdout, stderr) => {
            if (error) {
              console.log(`    ⚠️  Import hiba: ${error.message}`);
              resolve(null);
            } else {
              console.log(`    ✅ Import siker: ${stdout}`);
              resolve(stdout);
            }
          },
        );
      });
    } catch (error) {
      console.log(`    ⚠️  Import trigger hiba: ${error.message}`);
    }
  }

  async updateMatchTimes(): Promise<void> {
    console.log('🔧 3. Meccs időpontok javítása...');

    // Update matches without proper time
    const matchesWithoutTime = await prisma.match.findMany({
      where: { date: undefined },
      select: { id: true },
    });

    console.log(`  📊 Időpont nélküli meccsek: ${matchesWithoutTime.length}`);

    // For now, just log - you would implement proper time extraction here
    console.log('  ⚠️  Időpont javítás implementálása szükséges');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const fixer = new DataFixer();

  switch (command) {
    case 'fix-all':
      await fixer.fixAll();
      break;
    case 'fix-duplicates':
      await fixer.fixDuplicateTeams();
      break;
    case 'reimport':
      await fixer.reimportCleanData();
      break;
    case 'fix-times':
      await fixer.updateMatchTimes();
      break;
    default:
      console.log('🔧 Adatjavító eszköz');
      console.log('');
      console.log('Használat:');
      console.log(
        '  npx ts-node scripts/data-fixer.ts fix-all        # Minden javítás',
      );
      console.log(
        '  npx ts-node scripts/data-fixer.ts fix-duplicates # Duplikátumok javítása',
      );
      console.log(
        '  npx ts-node scripts/data-fixer.ts reimport       # Tiszta újraimportálás',
      );
      console.log(
        '  npx ts-node scripts/data-fixer.ts fix-times      # Időpontok javítása',
      );
      break;
  }
}

if (require.main === module) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

export { DataFixer };
