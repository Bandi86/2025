const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function fixMissingMainMarketOdds() {
  console.log('🔧 Fixing missing main market odds from JSON...');

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

  if (problemMatches.length === 0) {
    console.log('✅ No problem matches found!');
    await prisma.$disconnect();
    return;
  }

  // Load JSON data
  const jsonDir = path.join(
    __dirname,
    '../../../ml_pipeline/betting_extractor/jsons/processed',
  );
  const jsonFiles = fs.readdirSync(jsonDir).filter((f) => f.endsWith('.json'));

  console.log(`📁 Found ${jsonFiles.length} JSON files`);

  let fixedCount = 0;

  for (const jsonFile of jsonFiles) {
    const jsonPath = path.join(jsonDir, jsonFile);
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    for (const match of data.matches) {
      // Try to find this match in our problem matches
      const problemMatch = problemMatches.find(
        (pm) =>
          pm.homeTeam.name.toLowerCase().includes(match.team1.toLowerCase()) &&
          pm.awayTeam.name.toLowerCase().includes(match.team2.toLowerCase()),
      );

      if (problemMatch) {
        // Find the main market in JSON
        const mainMarketJson = match.markets.find((m) => m.name === 'Fő piac');

        if (
          mainMarketJson &&
          mainMarketJson.odds1 &&
          mainMarketJson.oddsX &&
          mainMarketJson.odds2
        ) {
          console.log(
            `🔧 Fixing: ${problemMatch.homeTeam.name} vs ${problemMatch.awayTeam.name}`,
          );
          console.log(
            `   JSON odds: ${mainMarketJson.odds1} / ${mainMarketJson.oddsX} / ${mainMarketJson.odds2}`,
          );

          const mainMarket = problemMatch.markets[0];

          try {
            // Create the missing odds
            await prisma.odds.createMany({
              data: [
                {
                  marketId: mainMarket.id,
                  type: 'odds1',
                  value: parseFloat(mainMarketJson.odds1),
                },
                {
                  marketId: mainMarket.id,
                  type: 'oddsX',
                  value: parseFloat(mainMarketJson.oddsX),
                },
                {
                  marketId: mainMarket.id,
                  type: 'odds2',
                  value: parseFloat(mainMarketJson.odds2),
                },
              ],
            });

            console.log(`   ✅ Fixed!`);
            fixedCount++;

            // Remove from problem matches to avoid duplicates
            const index = problemMatches.indexOf(problemMatch);
            if (index > -1) problemMatches.splice(index, 1);
          } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
          }
        } else {
          console.log(
            `   ⚠️  No main market found in JSON for ${problemMatch.homeTeam.name} vs ${problemMatch.awayTeam.name}`,
          );
        }
      }
    }
  }

  console.log(`\n🎉 Fixed ${fixedCount} matches!`);
  console.log(`❌ Remaining problem matches: ${problemMatches.length}`);

  if (problemMatches.length > 0) {
    console.log('\n📝 Remaining problems:');
    problemMatches.slice(0, 5).forEach((match, index) => {
      console.log(
        `${index + 1}. ${match.homeTeam.name} vs ${match.awayTeam.name}`,
      );
    });
  }

  await prisma.$disconnect();
}

fixMissingMainMarketOdds().catch(console.error);
