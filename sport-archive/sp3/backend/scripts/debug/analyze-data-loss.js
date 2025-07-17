const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeDataLoss() {
  console.log('🔍 Analyzing data loss from deduplication...');

  // Check a few sample matches to see how much data was lost
  const sampleMatches = [
    { team1: 'dortmund', team2: 'monterrey', expected: 38 },
    { team1: 'svajc', team2: 'norvegia', expected: 65 },
    { team1: 'real madrid', team2: 'pachuca', expected: 50 },
    { team1: 'mexiko', team2: 'honduras', expected: 30 },
  ];

  let totalLost = 0;
  let totalExpected = 0;

  for (const sample of sampleMatches) {
    const match = await prisma.match.findFirst({
      where: {
        homeTeam: { name: { contains: sample.team1, mode: 'insensitive' } },
        awayTeam: { name: { contains: sample.team2, mode: 'insensitive' } },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        markets: true,
      },
    });

    if (match) {
      const actual = match.markets.length;
      const expected = sample.expected;
      const lost = expected - actual;

      console.log(`📊 ${match.homeTeam.name} vs ${match.awayTeam.name}:`);
      console.log(`   Expected: ${expected} markets`);
      console.log(`   Actual: ${actual} markets`);
      console.log(
        `   Lost: ${lost} markets (${Math.round((lost / expected) * 100)}%)`,
      );

      totalLost += lost;
      totalExpected += expected;
    }
  }

  console.log(`\n📈 SUMMARY:`);
  console.log(`   Total expected: ${totalExpected} markets`);
  console.log(`   Total lost: ${totalLost} markets`);
  console.log(
    `   Data loss: ${Math.round((totalLost / totalExpected) * 100)}%`,
  );

  // Check overall database state
  const totalMatches = await prisma.match.count();
  const totalMarkets = await prisma.market.count();
  const totalOdds = await prisma.odds.count();

  console.log(`\n🗃️  DATABASE STATE:`);
  console.log(`   Matches: ${totalMatches}`);
  console.log(`   Markets: ${totalMarkets}`);
  console.log(`   Odds: ${totalOdds}`);
  console.log(
    `   Avg markets per match: ${Math.round((totalMarkets / totalMatches) * 100) / 100}`,
  );

  if (totalMarkets / totalMatches < 10) {
    console.log('\n❌ CRITICAL: Very low market count per match!');
    console.log('💡 RECOMMENDATION: Full re-import needed');
  } else if (totalMarkets / totalMatches < 20) {
    console.log('\n⚠️  WARNING: Low market count per match');
    console.log('💡 RECOMMENDATION: Consider selective re-import');
  } else {
    console.log('\n✅ Market count looks reasonable');
  }

  await prisma.$disconnect();
}

analyzeDataLoss().catch(console.error);
