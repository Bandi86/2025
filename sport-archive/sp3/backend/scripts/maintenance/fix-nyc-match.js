const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixNYCMatch() {
  console.log('🔧 Fixing New York City FC vs Toronto FC match...');

  // Find the match
  const match = await prisma.match.findFirst({
    where: {
      homeTeam: { name: { contains: 'new york city', mode: 'insensitive' } },
      awayTeam: { name: { contains: 'toronto', mode: 'insensitive' } },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  if (match) {
    console.log(`📅 Match: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
    console.log(`📅 Current date: ${match.date.toISOString()}`);

    // This match should be 01:30 Budapest on July 4 = 23:30 UTC on July 3
    const correctDate = new Date('2025-07-03T23:30:00.000Z');

    console.log(`📅 Correct date: ${correctDate.toISOString()}`);

    // Update the match
    await prisma.match.update({
      where: { id: match.id },
      data: { date: correctDate },
    });

    console.log(`✅ Updated match ${match.id}`);

    // Verify
    const updatedMatch = await prisma.match.findFirst({
      where: { id: match.id },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    const utcHour = updatedMatch.date.getUTCHours();
    const utcMinute = updatedMatch.date.getUTCMinutes();
    const budapestHour = (utcHour + 2) % 24;

    console.log(`\n📊 Verification:`);
    console.log(
      `📅 ${updatedMatch.homeTeam.name} vs ${updatedMatch.awayTeam.name}`,
    );
    console.log(`📅 UTC: ${updatedMatch.date.toISOString()}`);
    console.log(
      `📅 Budapest: ${budapestHour}:${utcMinute.toString().padStart(2, '0')}`,
    );

    if (updatedMatch.date.toISOString() === '2025-07-03T23:30:00.000Z') {
      console.log('✅ CORRECT: Match is now stored correctly');
    } else {
      console.log('❌ INCORRECT: Match is still wrong');
    }
  } else {
    console.log('❌ Match not found');
  }

  await prisma.$disconnect();
}

fixNYCMatch().catch(console.error);
