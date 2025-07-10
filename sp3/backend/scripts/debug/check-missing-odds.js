const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMissingOdds() {
  console.log('🔍 Checking matches with missing odds...');

  // Check Svájc vs Norvégia (EB női)
  console.log('\n=== SVÁJC VS NORVÉGIA (EB NŐI) ===');
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
    console.log(`📅 Date: ${swissMatch.date.toISOString()}`);
    console.log(`📊 Markets: ${swissMatch.markets.length}`);

    // Check main market odds
    const mainMarket = swissMatch.markets.find((m) => m.name === 'Fő piac');
    if (mainMarket) {
      console.log(`📈 Main market odds: ${mainMarket.odds.length}`);
      mainMarket.odds.forEach((odd) => {
        console.log(`   ${odd.outcome}: ${odd.value}`);
      });
    } else {
      console.log('❌ No main market found');
    }

    // Check if any market has odds
    const hasOdds = swissMatch.markets.some((m) => m.odds.length > 0);
    console.log(`📊 Has any odds: ${hasOdds}`);

    if (!hasOdds) {
      console.log('❌ NO ODDS FOUND for this match');
    }
  } else {
    console.log('❌ Svájc vs Norvégia match not found');
  }

  // Check Izland vs Finnország (EB női)
  console.log('\n=== IZLAND VS FINNORSZÁG (EB NŐI) ===');
  const icelandMatch = await prisma.match.findFirst({
    where: {
      homeTeam: { name: { contains: 'izland', mode: 'insensitive' } },
      awayTeam: { name: { contains: 'finnorszag', mode: 'insensitive' } },
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

  if (icelandMatch) {
    console.log(
      `📅 Match: ${icelandMatch.homeTeam.name} vs ${icelandMatch.awayTeam.name}`,
    );
    console.log(`🏆 Competition: ${icelandMatch.competition.name}`);
    console.log(`📅 Date: ${icelandMatch.date.toISOString()}`);
    console.log(`📊 Markets: ${icelandMatch.markets.length}`);

    // Check main market odds
    const mainMarket = icelandMatch.markets.find((m) => m.name === 'Fő piac');
    if (mainMarket) {
      console.log(`📈 Main market odds: ${mainMarket.odds.length}`);
      mainMarket.odds.forEach((odd) => {
        console.log(`   ${odd.outcome}: ${odd.value}`);
      });
    } else {
      console.log('❌ No main market found');
    }

    // Check if any market has odds
    const hasOdds = icelandMatch.markets.some((m) => m.odds.length > 0);
    console.log(`📊 Has any odds: ${hasOdds}`);

    if (!hasOdds) {
      console.log('❌ NO ODDS FOUND for this match');
    }
  } else {
    console.log('❌ Izland vs Finnország match not found');
  }

  // Check how many matches have missing odds overall
  console.log('\n=== OVERALL MISSING ODDS ANALYSIS ===');
  const allMatches = await prisma.match.findMany({
    include: {
      markets: {
        include: {
          odds: true,
        },
      },
    },
  });

  const matchesWithoutOdds = allMatches.filter((match) => {
    return !match.markets.some((market) => market.odds.length > 0);
  });

  console.log(`📊 Total matches: ${allMatches.length}`);
  console.log(`❌ Matches without odds: ${matchesWithoutOdds.length}`);
  console.log(
    `✅ Matches with odds: ${allMatches.length - matchesWithoutOdds.length}`,
  );

  if (matchesWithoutOdds.length > 0) {
    console.log('\n📝 Matches without odds:');
    matchesWithoutOdds.slice(0, 10).forEach((match, index) => {
      console.log(
        `${index + 1}. ${match.homeTeam?.name || 'Unknown'} vs ${match.awayTeam?.name || 'Unknown'}`,
      );
    });
    if (matchesWithoutOdds.length > 10) {
      console.log(`... and ${matchesWithoutOdds.length - 10} more`);
    }
  }

  await prisma.$disconnect();
}

checkMissingOdds().catch(console.error);
