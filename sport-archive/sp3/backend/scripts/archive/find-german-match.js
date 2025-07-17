const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findGermanMatch() {
  console.log('🔍 Searching for German match...');

  // Try different search patterns
  const searchTerms = [
    'Németország',
    'nemetorszag',
    'germany',
    'deutscher',
    'Lengyelország',
    'lengyelorszag',
    'poland',
    'polska',
  ];

  for (const term of searchTerms) {
    console.log(`\n🔍 Searching for: ${term}`);

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { homeTeam: { name: { contains: term, mode: 'insensitive' } } },
          { awayTeam: { name: { contains: term, mode: 'insensitive' } } },
        ],
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      take: 5,
    });

    if (matches.length > 0) {
      console.log(`📊 Found ${matches.length} matches:`);
      for (const match of matches) {
        const budapestTime = new Date(
          match.date.getTime() + 2 * 60 * 60 * 1000,
        );
        console.log(`📅 ${match.homeTeam.name} vs ${match.awayTeam.name}`);
        console.log(`   Date: ${match.date.toISOString().split('T')[0]}`);
        console.log(`   UTC: ${match.date.toISOString()}`);
        console.log(`   Budapest: ${budapestTime.toLocaleString('hu-HU')}`);
        console.log(`   ---`);
      }
    } else {
      console.log('❌ No matches found');
    }
  }

  // Also check what the JSON says about this match
  console.log('\n🔍 Checking JSON file for German match...');

  const fs = require('fs');
  const jsonData = JSON.parse(
    fs.readFileSync(
      '/home/bandi/Documents/code/2025/sp3/ml_pipeline/betting_extractor/jsons/processed/Web__52sz__K__07-01_lines.json',
      'utf8',
    ),
  );

  const germanMatchInJson = jsonData.matches.find(
    (m) =>
      (m.orig_team1 && m.orig_team1.toLowerCase().includes('német')) ||
      (m.orig_team2 && m.orig_team2.toLowerCase().includes('német')) ||
      (m.orig_team1 && m.orig_team1.toLowerCase().includes('lengyel')) ||
      (m.orig_team2 && m.orig_team2.toLowerCase().includes('lengyel')),
  );

  if (germanMatchInJson) {
    console.log('📄 Found in JSON:');
    console.log(
      `   Team 1: ${germanMatchInJson.orig_team1} (${germanMatchInJson.team1})`,
    );
    console.log(
      `   Team 2: ${germanMatchInJson.orig_team2} (${germanMatchInJson.team2})`,
    );
    console.log(`   Date: ${germanMatchInJson.date}`);
    console.log(`   Time: ${germanMatchInJson.time}`);
    console.log(`   League: ${germanMatchInJson.league}`);
  } else {
    console.log('❌ Not found in JSON');
  }

  await prisma.$disconnect();
}

findGermanMatch().catch(console.error);
