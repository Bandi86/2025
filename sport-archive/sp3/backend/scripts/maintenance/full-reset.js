const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function fullReset() {
  console.log('🗑️ TELJES RESET - Minden adat törlése...');

  try {
    // 1. Adatbázis teljes törlése
    console.log('\n📊 Adatbázis törlése...');

    console.log('   Törölöm odds tábla...');
    await prisma.odds.deleteMany({});

    console.log('   Törölöm markets tábla...');
    await prisma.market.deleteMany({});

    console.log('   Törölöm matches tábla...');
    await prisma.match.deleteMany({});

    console.log('   Törölöm competition_teams tábla...');
    await prisma.competitionTeam.deleteMany({});

    console.log('   Törölöm competitions tábla...');
    await prisma.competition.deleteMany({});

    console.log('   Törölöm teams tábla...');
    await prisma.team.deleteMany({});

    console.log('✅ Adatbázis törölve!');

    // 2. JSON fájlok törlése
    console.log('\n📁 JSON fájlok törlése...');

    const jsonDir = path.join(
      __dirname,
      '../../../ml_pipeline/betting_extractor/jsons/processed',
    );

    if (fs.existsSync(jsonDir)) {
      const files = fs.readdirSync(jsonDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      console.log(`   Talált ${jsonFiles.length} JSON fájl`);

      for (const file of jsonFiles) {
        const filePath = path.join(jsonDir, file);
        fs.unlinkSync(filePath);
        console.log(`   ✅ Törölve: ${file}`);
      }

      console.log('✅ JSON fájlok törölve!');
    } else {
      console.log('⚠️ JSON mappa nem található');
    }

    // 3. Backup fájlok törlése
    console.log('\n🗂️ Backup fájlok törlése...');

    const backupFiles = [
      'backup_1751645320999.json',
      // Add more backup file patterns if needed
    ];

    for (const backupFile of backupFiles) {
      const backupPath = path.join(__dirname, '../archive', backupFile);
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
        console.log(`   ✅ Törölve: ${backupFile}`);
      }
    }

    console.log('\n🎉 TELJES RESET BEFEJEZVE!');
    console.log('📊 Adatbázis: ÜRE');
    console.log('📁 JSON fájlok: TÖRÖLVE');
    console.log('🗂️ Backup fájlok: TÖRÖLVE');

    console.log('\n💡 Holnap:');
    console.log('1. Új JSON fájlok generálása');
    console.log('2. Tiszta import logika írása');
    console.log('3. Tesztelés és validáció');
    console.log('4. Végleges megoldás kialakítása');
  } catch (error) {
    console.error('❌ Hiba a reset során:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fullReset().catch(console.error);
