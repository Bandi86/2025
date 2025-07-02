import { PrismaClient, MatchStatus, DataSource } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const jsonDir = path.resolve(
    __dirname,
    '../../../sp3/ml_pipeline/betting_extractor/jsons',
  );
  const files = fs.readdirSync(jsonDir).filter((f) => f.endsWith('.json'));
  console.log(`Found ${files.length} JSON files.`);

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(jsonDir, file), 'utf-8'));
    for (const match of data.matches) {
      // 1. Competition keresés/létrehozás
      let competition = await prisma.competition.findFirst({
        where: { name: match.league },
      });
      if (!competition) {
        competition = await prisma.competition.create({
          data: {
            name: match.league,
            season:
              match.date?.slice(0, 4) +
              '/' +
              (parseInt(match.date?.slice(0, 4)) + 1),
            country: 'Unknown',
          },
        });
      }

      // 2. Team keresés/létrehozás (mindkét csapat)
      let team1 = await prisma.team.findFirst({ where: { name: match.team1 } });
      if (!team1) {
        team1 = await prisma.team.create({
          data: { name: match.team1, country: 'Unknown' },
        });
      }
      let team2 = await prisma.team.findFirst({ where: { name: match.team2 } });
      if (!team2) {
        team2 = await prisma.team.create({
          data: { name: match.team2, country: 'Unknown' },
        });
      }

      // 3. Match upsert (egyedi kulcs: date, homeTeamId, awayTeamId, competitionId)
      const matchId =
        `${match.date}_${team1.id}_${team2.id}_${competition.id}`.replace(
          /[^a-zA-Z0-9_]/g,
          '',
        );
      let matchRecord = await prisma.match.findUnique({
        where: { id: matchId },
      });
      if (!matchRecord) {
        matchRecord = await prisma.match.create({
          data: {
            id: matchId,
            date: new Date(`${match.date}T${match.time}`),
            homeTeamId: team1.id,
            awayTeamId: team2.id,
            competitionId: competition.id,
            season: competition.season,
            status: MatchStatus.SCHEDULED,
            sourceType: DataSource.PDF_EXTRACTION,
          },
        });
      }

      // 4. Marketek törlése és újraimportálása
      await prisma.market.deleteMany({ where: { matchId: matchRecord.id } });
      for (const market of match.markets) {
        await prisma.market.create({
          data: {
            matchId: matchRecord.id,
            name: market.name,
            origName: market.orig_market,
            odds1: market.odds1 ? parseFloat(market.odds1) : null,
            oddsX: market.oddsX ? parseFloat(market.oddsX) : null,
            odds2: market.odds2 ? parseFloat(market.odds2) : null,
          },
        });
      }
      console.log(
        `Imported match: ${match.team1} vs ${match.team2} (${match.date})`,
      );
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
