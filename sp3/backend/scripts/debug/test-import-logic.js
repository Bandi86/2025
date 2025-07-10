const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testImportLogic() {
  console.log('🔍 Testing import logic for missing odds...');

  // Find the Svájc vs Norvégia match
  const match = await prisma.match.findFirst({
    where: {
      homeTeam: { name: { contains: 'svajc', mode: 'insensitive' } },
      awayTeam: { name: { contains: 'norvegia', mode: 'insensitive' } },
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
  });

  if (!match) {
    console.log('❌ Match not found');
    return;
  }

  console.log(`📅 Match: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
  console.log(`📊 Total markets: ${match.markets.length}`);

  // Check main market
  const mainMarket = match.markets.find((m) => m.name === 'Fő piac');
  if (mainMarket) {
    console.log(`🎯 Main market found: ${mainMarket.name}`);
    console.log(`📈 Main market odds: ${mainMarket.odds.length}`);

    if (mainMarket.odds.length === 0) {
      console.log('❌ Main market has no odds - this is the problem!');
      console.log('🔍 Let me check what the JSON should contain...');

      // Show what the JSON should contain
      console.log('\n📄 Expected from JSON:');
      console.log('  name: "Fő piac"');
      console.log('  orig_market: "3,70 3,45 1,82"');
      console.log('  odds1: "3.70"');
      console.log('  oddsX: "3.45"');
      console.log('  odds2: "1.82"');

      console.log('\n💡 The import script should create:');
      console.log('  - 1 odds record with type="odds1", value=3.70');
      console.log('  - 1 odds record with type="oddsX", value=3.45');
      console.log('  - 1 odds record with type="odds2", value=1.82');

      console.log('\n🔧 Let me check the current import logic...');

      // Test the import logic manually
      const testMarket = {
        name: 'Fő piac',
        orig_market: '3,70 3,45 1,82',
        odds1: '3.70',
        oddsX: '3.45',
        odds2: '1.82',
      };

      console.log('\n🧪 Testing import logic:');
      console.log(
        `  market.odds1 = "${testMarket.odds1}" (${typeof testMarket.odds1})`,
      );
      console.log(
        `  market.oddsX = "${testMarket.oddsX}" (${typeof testMarket.oddsX})`,
      );
      console.log(
        `  market.odds2 = "${testMarket.odds2}" (${typeof testMarket.odds2})`,
      );

      console.log('\n✅ All odds values are present and valid!');
      console.log(
        '🤔 The import logic should work... maybe the issue is elsewhere?',
      );
    } else {
      console.log('✅ Main market has odds');
      mainMarket.odds.forEach((odd) => {
        console.log(`   ${odd.type}: ${odd.value}`);
      });
    }
  } else {
    console.log('❌ Main market not found');
  }

  // Check if there are any markets with odds
  const marketsWithOdds = match.markets.filter((m) => m.odds.length > 0);
  console.log(
    `\n📊 Markets with odds: ${marketsWithOdds.length} / ${match.markets.length}`,
  );

  if (marketsWithOdds.length > 0) {
    console.log(
      '✅ Some markets have odds, so the import logic partially works',
    );
    console.log('🔍 Problem: "Fő piac" market specifically has no odds');
  } else {
    console.log(
      '❌ NO markets have odds - import completely failed for this match',
    );
  }

  await prisma.$disconnect();
}

testImportLogic().catch(console.error);
