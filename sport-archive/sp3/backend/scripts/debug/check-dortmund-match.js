const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDortmundMatch() {
  console.log('🔍 Checking Dortmund vs Monterrey match...');

  // Find the match
  const match = await prisma.match.findFirst({
    where: {
      homeTeam: { name: { contains: 'dortmund', mode: 'insensitive' } },
      awayTeam: { name: { contains: 'monterrey', mode: 'insensitive' } },
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

  if (match) {
    console.log(`📅 Match: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
    console.log(`🏆 Competition: ${match.competition.name}`);
    console.log(`📅 Date: ${match.date.toISOString()}`);
    console.log(`📊 Total markets: ${match.markets.length}`);

    // Show all markets
    console.log('\n📋 All markets:');
    match.markets.forEach((market, index) => {
      console.log(
        `${index + 1}. "${market.name}" (${market.odds.length} odds)`,
      );
    });

    // Check main market
    const mainMarket = match.markets.find((m) => m.name === 'Fő piac');
    if (mainMarket) {
      console.log(`\n🎯 Main market odds: ${mainMarket.odds.length}`);
      mainMarket.odds.forEach((odd) => {
        console.log(`   ${odd.type}: ${odd.value}`);
      });
    } else {
      console.log('\n❌ No main market found');
    }

    // Check what the JSON should contain
    console.log('\n📄 Expected from news: ~50 markets');
    console.log(`📊 Actual in DB: ${match.markets.length} markets`);

    if (match.markets.length < 30) {
      console.log(
        '❌ PROBLEM: Too few markets - data was lost during deduplication!',
      );
    } else {
      console.log('✅ Market count looks good');
    }
  } else {
    console.log('❌ Dortmund vs Monterrey match not found');
  }

  await prisma.$disconnect();
}

checkDortmundMatch().catch(console.error);
