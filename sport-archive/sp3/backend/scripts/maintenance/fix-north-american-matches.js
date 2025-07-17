const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixNorthAmericanMatches() {
  console.log(
    '🔧 Fixing North American matches (MLS, USL Championship, Gold Cup)...',
  );

  // Find all matches in these competitions that are on July 3rd
  const competitions = ['MLS', 'USL Championship', 'Gold Cup'];

  for (const compName of competitions) {
    console.log(`\n🔍 Checking ${compName} matches...`);

    const matches = await prisma.match.findMany({
      where: {
        competition: {
          name: compName,
        },
        date: {
          gte: new Date('2025-07-03T00:00:00Z'),
          lt: new Date('2025-07-04T00:00:00Z'),
        },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
      },
    });

    console.log(`📊 Found ${matches.length} matches on July 3rd`);

    for (const match of matches) {
      console.log(
        `\n📅 Match: ${match.homeTeam.name} vs ${match.awayTeam.name}`,
      );
      console.log(`📅 Current date: ${match.date.toISOString()}`);

      // Move the match 1 day forward
      const newDate = new Date(match.date);
      newDate.setDate(newDate.getDate() + 1);

      console.log(`📅 New date: ${newDate.toISOString()}`);

      // Update the match
      await prisma.match.update({
        where: { id: match.id },
        data: { date: newDate },
      });

      console.log(`✅ Updated match ${match.id}`);
    }
  }

  console.log('\n🎯 Verification: checking updated matches...');

  // Verify the changes
  const updatedMatches = await prisma.match.findMany({
    where: {
      OR: [
        { homeTeam: { name: { contains: 'mexiko', mode: 'insensitive' } } },
        {
          homeTeam: {
            name: { contains: 'new york city', mode: 'insensitive' },
          },
        },
        { homeTeam: { name: { contains: 'birmingham', mode: 'insensitive' } } },
      ],
      date: {
        gte: new Date('2025-07-04T00:00:00Z'),
        lt: new Date('2025-07-05T00:00:00Z'),
      },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      competition: true,
    },
  });

  console.log(`\n📊 Found ${updatedMatches.length} matches now on July 4th`);

  for (const match of updatedMatches) {
    const utcHour = match.date.getUTCHours();
    const utcMinute = match.date.getUTCMinutes();
    const budapestHour = (utcHour + 2) % 24;

    console.log(`📅 ${match.homeTeam.name} vs ${match.awayTeam.name}`);
    console.log(`📅 UTC: ${match.date.toISOString()}`);
    console.log(
      `📅 Budapest: ${budapestHour}:${utcMinute.toString().padStart(2, '0')}`,
    );
    console.log(`🏆 Competition: ${match.competition.name}`);
  }

  await prisma.$disconnect();
}

fixNorthAmericanMatches().catch(console.error);
