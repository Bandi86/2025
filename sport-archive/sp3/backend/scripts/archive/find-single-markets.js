const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findSingleMarketMatches() {
  try {
    console.log('🔍 Looking for matches with exactly 1 market...');

    // Get matches with exactly 1 market
    const singleMarketMatches = await prisma.match.findMany({
      where: {
        markets: {
          some: {},
        },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        markets: {
          include: {
            odds: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Filter for exactly 1 market
    const exactlyOneMarket = singleMarketMatches.filter(
      (match) => match.markets.length === 1,
    );

    console.log(
      `📊 Found ${exactlyOneMarket.length} matches with exactly 1 market`,
    );

    if (exactlyOneMarket.length > 0) {
      console.log('\n🎯 Sample matches with 1 market:');

      exactlyOneMarket.slice(0, 10).forEach((match) => {
        console.log(
          `\n🏆 ${match.homeTeam.fullName} vs ${match.awayTeam.fullName}`,
        );
        console.log(`   Date: ${match.date.toLocaleDateString()}`);
        console.log(`   Market: ${match.markets[0].name}`);
        console.log(`   Odds count: ${match.markets[0].odds.length}`);

        // Simulate frontend logic
        const mainMarket = match.markets[0];
        const otherMarkets = match.markets.filter(
          (m) => m.id !== mainMarket.id,
        );
        const additionalMarketsCount = otherMarkets.length;

        console.log(`   Additional markets: ${additionalMarketsCount}`);
        console.log(
          `   Show button: ${additionalMarketsCount > 0 ? '✅ YES' : '❌ NO'}`,
        );
      });
    }

    // Also check market distribution
    const marketDistribution = {};
    singleMarketMatches.forEach((match) => {
      const count = match.markets.length;
      marketDistribution[count] = (marketDistribution[count] || 0) + 1;
    });

    console.log('\n📈 Market count distribution:');
    Object.entries(marketDistribution)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([count, matches]) => {
        console.log(`   ${count} markets: ${matches} matches`);
      });

    // Check for duplicate markets within matches
    console.log('\n🔍 Checking for duplicate markets within matches...');

    const matchesWithDuplicateMarkets = singleMarketMatches.filter((match) => {
      const marketNames = match.markets.map((m) => m.name);
      return marketNames.length !== new Set(marketNames).size;
    });

    console.log(
      `Found ${matchesWithDuplicateMarkets.length} matches with duplicate market names`,
    );

    if (matchesWithDuplicateMarkets.length > 0) {
      console.log('\n🔄 Sample matches with duplicate markets:');
      matchesWithDuplicateMarkets.slice(0, 5).forEach((match) => {
        const marketNames = match.markets.map((m) => m.name);
        const duplicates = marketNames.filter(
          (name, index) => marketNames.indexOf(name) !== index,
        );

        console.log(
          `\n🏆 ${match.homeTeam.fullName} vs ${match.awayTeam.fullName}`,
        );
        console.log(`   Total markets: ${match.markets.length}`);
        console.log(`   Unique market names: ${new Set(marketNames).size}`);
        console.log(`   Duplicates: ${[...new Set(duplicates)].join(', ')}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findSingleMarketMatches();
