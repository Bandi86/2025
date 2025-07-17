const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugMainMarketOdds() {
  console.log('🔍 Debugging main market odds...');

  // Check Svájc vs Norvégia detailed
  console.log('\n=== SVÁJC VS NORVÉGIA DETAILED ===');
  const swissMatch = await prisma.match.findFirst({
    where: {
      homeTeam: { name: { contains: 'svajc', mode: 'insensitive' } },
      awayTeam: { name: { contains: 'norvegia', mode: 'insensitive' } },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      competition: true,
      markets: {
        include: {
          odds: true,
        },
      },
    },
  });

  if (swissMatch) {
    console.log(
      `📅 Match: ${swissMatch.homeTeam.name} vs ${swissMatch.awayTeam.name}`,
    );
    console.log(`🏆 Competition: ${swissMatch.competition.name}`);
    console.log(`📊 Total markets: ${swissMatch.markets.length}`);

    // List all market names
    console.log('\n📋 All market names:');
    swissMatch.markets.forEach((market, index) => {
      console.log(
        `${index + 1}. "${market.name}" (${market.odds.length} odds)`,
      );
      if (market.odds.length > 0) {
        market.odds.forEach((odd) => {
          console.log(`   ${odd.type}: ${odd.value}`);
        });
      }
    });

    // Check if there's a market that looks like main market
    const possibleMainMarkets = swissMatch.markets.filter(
      (m) =>
        m.name.toLowerCase().includes('fő') ||
        m.name.toLowerCase().includes('1x2') ||
        m.name.toLowerCase().includes('match result') ||
        m.name.toLowerCase().includes('eredmény'),
    );

    console.log(`\n🎯 Possible main markets: ${possibleMainMarkets.length}`);
    possibleMainMarkets.forEach((market) => {
      console.log(`   "${market.name}" (${market.odds.length} odds)`);
    });

    // Check markets with odds
    const marketsWithOdds = swissMatch.markets.filter((m) => m.odds.length > 0);
    console.log(`\n📈 Markets with odds: ${marketsWithOdds.length}`);
    marketsWithOdds.slice(0, 5).forEach((market) => {
      console.log(`   "${market.name}" (${market.odds.length} odds)`);
      market.odds.forEach((odd) => {
        console.log(`     ${odd.type}: ${odd.value}`);
      });
    });
  }

  await prisma.$disconnect();
}

debugMainMarketOdds().catch(console.error);
