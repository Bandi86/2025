const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findSingleMarketMatches() {
  try {
    console.log('🔍 Searching for matches with only 1 market...');

    // Get all matches with their markets
    const matches = await prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
        markets: true,
      },
    });

    console.log(`\n📊 Analyzing ${matches.length} total matches`);

    const singleMarketMatches = matches.filter(
      (match) => match.markets.length === 1,
    );

    if (singleMarketMatches.length === 0) {
      console.log(
        '✅ No matches with only 1 market found! All matches have multiple markets.',
      );
    } else {
      console.log(
        `\n⚠️  Found ${singleMarketMatches.length} matches with only 1 market:`,
      );
      singleMarketMatches.forEach((match) => {
        console.log(
          `🔹 ${match.homeTeam.fullName} vs ${match.awayTeam.fullName}`,
        );
        console.log(`   Date: ${match.date.toISOString()}`);
        console.log(`   Market: ${match.markets[0].name}`);
        console.log('');
      });
    }

    // Also check market count distribution
    const marketCounts = {};
    matches.forEach((match) => {
      const count = match.markets.length;
      marketCounts[count] = (marketCounts[count] || 0) + 1;
    });

    console.log('\n📊 Market count distribution:');
    Object.entries(marketCounts)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([count, matches]) => {
        console.log(`${count} markets: ${matches} matches`);
      });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findSingleMarketMatches();
