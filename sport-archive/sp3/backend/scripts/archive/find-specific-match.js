const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findSpecificMatch() {
  console.log('🔍 Searching for specific German match on July 4...');

  // Search for matches on July 4th that could be the German match
  const july4Matches = await prisma.match.findMany({
    where: {
      date: {
        gte: new Date('2025-07-04T00:00:00Z'),
        lt: new Date('2025-07-05T00:00:00Z'),
      },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  console.log(`📊 Found ${july4Matches.length} matches on July 4th:`);

  for (const match of july4Matches) {
    const budapestTime = new Date(match.date.getTime() + 2 * 60 * 60 * 1000);
    const isGermanMatch =
      match.homeTeam.name.toLowerCase().includes('nemetorszag') ||
      match.awayTeam.name.toLowerCase().includes('nemetorszag') ||
      match.homeTeam.name.toLowerCase().includes('lengyelorszag') ||
      match.awayTeam.name.toLowerCase().includes('lengyelorszag');

    console.log(
      `📅 ${match.homeTeam.name} vs ${match.awayTeam.name} ${isGermanMatch ? '🇩🇪🇵🇱' : ''}`,
    );
    console.log(`   UTC: ${match.date.toISOString()}`);
    console.log(`   Budapest: ${budapestTime.toLocaleString('hu-HU')}`);

    if (isGermanMatch) {
      console.log(`   ✅ THIS IS THE GERMAN MATCH!`);
      if (match.date.toISOString() === '2025-07-04T19:00:00.000Z') {
        console.log(`   ✅ CORRECT TIME: 21:00 Budapest (19:00 UTC)`);
      } else {
        console.log(`   ❌ WRONG TIME: Should be 21:00 Budapest (19:00 UTC)`);
      }
    }
    console.log(`   ---`);
  }

  // Also search by team names directly
  console.log('\n🔍 Direct search for team names...');

  const directSearch = await prisma.match.findFirst({
    where: {
      date: {
        gte: new Date('2025-07-04T00:00:00Z'),
        lt: new Date('2025-07-05T00:00:00Z'),
      },
      OR: [
        {
          AND: [
            {
              homeTeam: {
                name: { contains: 'nemetorszag', mode: 'insensitive' },
              },
            },
            {
              awayTeam: {
                name: { contains: 'lengyelorszag', mode: 'insensitive' },
              },
            },
          ],
        },
        {
          AND: [
            {
              homeTeam: {
                name: { contains: 'lengyelorszag', mode: 'insensitive' },
              },
            },
            {
              awayTeam: {
                name: { contains: 'nemetorszag', mode: 'insensitive' },
              },
            },
          ],
        },
      ],
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  if (directSearch) {
    console.log('✅ Found the match!');
    console.log(
      `📅 ${directSearch.homeTeam.name} vs ${directSearch.awayTeam.name}`,
    );
    console.log(`   UTC: ${directSearch.date.toISOString()}`);
    const budapestTime = new Date(
      directSearch.date.getTime() + 2 * 60 * 60 * 1000,
    );
    console.log(`   Budapest: ${budapestTime.toLocaleString('hu-HU')}`);

    if (directSearch.date.toISOString() === '2025-07-04T19:00:00.000Z') {
      console.log(`   ✅ PERFECT: Match is at 21:00 Budapest time!`);
    } else {
      console.log(`   ❌ PROBLEM: Should be 21:00 Budapest time (19:00 UTC)`);
    }
  } else {
    console.log('❌ No direct match found');
  }

  await prisma.$disconnect();
}

findSpecificMatch().catch(console.error);
