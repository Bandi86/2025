const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMissingMainMarketOdds() {
  console.log('🔧 Fixing missing main market odds...');

  // Find matches with main markets that have no odds
  const matchesWithMainMarketsNoOdds = await prisma.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
      markets: {
        where: {
          name: 'Fő piac',
        },
        include: {
          odds: true,
        },
      },
    },
  });

  const problemMatches = matchesWithMainMarketsNoOdds.filter(
    (match) => match.markets.length > 0 && match.markets[0].odds.length === 0,
  );

  console.log(
    `🔍 Found ${problemMatches.length} matches with main markets but no odds`,
  );

  if (problemMatches.length > 0) {
    console.log('📝 Problem matches:');
    problemMatches.slice(0, 10).forEach((match, index) => {
      console.log(
        `${index + 1}. ${match.homeTeam.name} vs ${match.awayTeam.name}`,
      );
    });

    console.log(
      '\n💡 This means the import process has a bug with main market odds creation',
    );
    console.log('🚨 We need to run a fresh import or fix the existing data');

    // Find the first match for detailed analysis
    const firstMatch = problemMatches[0];
    if (firstMatch) {
      console.log(
        `\n🔍 Analyzing: ${firstMatch.homeTeam.name} vs ${firstMatch.awayTeam.name}`,
      );
      console.log(`   Main market ID: ${firstMatch.markets[0].id}`);
      console.log(`   Main market name: "${firstMatch.markets[0].name}"`);
      console.log(
        `   Main market origName: "${firstMatch.markets[0].origName}"`,
      );

      console.log('\n📊 Checking other markets for this match:');
      const allMarkets = await prisma.market.findMany({
        where: { matchId: firstMatch.id },
        include: { odds: true },
      });

      const marketsWithOdds = allMarkets.filter((m) => m.odds.length > 0);
      const marketsWithoutOdds = allMarkets.filter((m) => m.odds.length === 0);

      console.log(`   Total markets: ${allMarkets.length}`);
      console.log(`   Markets with odds: ${marketsWithOdds.length}`);
      console.log(`   Markets without odds: ${marketsWithoutOdds.length}`);

      if (marketsWithOdds.length > 0) {
        console.log('\n✅ Example market with odds:');
        const exampleMarket = marketsWithOdds[0];
        console.log(`   Name: "${exampleMarket.name}"`);
        console.log(`   Odds count: ${exampleMarket.odds.length}`);
        exampleMarket.odds.forEach((odd) => {
          console.log(`     ${odd.type}: ${odd.value}`);
        });
      }

      if (marketsWithoutOdds.length > 0) {
        console.log('\n❌ Markets without odds:');
        marketsWithoutOdds.slice(0, 5).forEach((market) => {
          console.log(`   "${market.name}"`);
        });
      }
    }
  } else {
    console.log('✅ All main markets have odds!');
  }

  await prisma.$disconnect();
}

fixMissingMainMarketOdds().catch(console.error);
