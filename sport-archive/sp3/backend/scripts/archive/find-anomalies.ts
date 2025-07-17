import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findAnomalies() {
  try {
    console.log('🔍 Anomáliák keresése az adatbázisban...\n');

    // 1. Furcsa csapatnevek (speciális karakterek, számok)
    const strangeTeams = await prisma.team.findMany({
      where: {
        OR: [
          { name: { contains: 'vs' } },
          { name: { contains: 'és' } },
          { name: { contains: 'kapura' } },
          { name: { contains: 'gol' } },
          { name: { contains: 'tarto' } },
          { name: { contains: 'szam' } },
          { name: { contains: 'kezdo' } },
        ],
      },
      select: {
        name: true,
        fullName: true,
        _count: { select: { homeMatches: true, awayMatches: true } },
      },
    });

    console.log(`🚨 Furcsa csapatnevek (${strangeTeams.length}):`);
    strangeTeams.forEach((team) => {
      const totalMatches = team._count.homeMatches + team._count.awayMatches;
      console.log(`  - "${team.name}" (${totalMatches} meccs)`);
    });

    // 2. Furcsa liganevek
    const strangeCompetitions = await prisma.competition.findMany({
      where: {
        OR: [
          { name: { contains: 'vs' } },
          { name: { contains: 'kapura' } },
          { name: { contains: 'gol' } },
          { name: { contains: 'tarto' } },
          { name: { contains: 'szam' } },
          { name: { contains: 'kezdo' } },
        ],
      },
      include: {
        _count: { select: { matches: true } },
      },
    });

    console.log(`\n🚨 Furcsa liganevek (${strangeCompetitions.length}):`);
    strangeCompetitions.forEach((comp) => {
      console.log(`  - "${comp.name}" (${comp._count.matches} meccs)`);
    });

    // 3. Duplikált meccsek (azonos dátum, csapatok, liga)
    const duplicateMatches = await prisma.match.groupBy({
      by: ['date', 'homeTeamId', 'awayTeamId', 'competitionId'],
      having: {
        id: { _count: { gt: 1 } },
      },
      _count: { id: true },
    });

    console.log(`\n📋 Duplikált meccsek (${duplicateMatches.length}):`);
    for (const dup of duplicateMatches.slice(0, 10)) {
      const matches = await prisma.match.findMany({
        where: {
          date: dup.date,
          homeTeamId: dup.homeTeamId,
          awayTeamId: dup.awayTeamId,
          competitionId: dup.competitionId,
        },
        include: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
          competition: { select: { name: true } },
        },
      });

      if (matches.length > 0) {
        const match = matches[0];
        console.log(
          `  - ${match.homeTeam.name} vs ${match.awayTeam.name} (${match.competition.name}) - ${dup._count.id} példány`,
        );
      }
    }

    // 4. Furcsa dátumok
    const futureDates = await prisma.match.findMany({
      where: {
        date: { gte: new Date('2025-12-31') },
      },
      select: {
        date: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        competition: { select: { name: true } },
      },
      take: 5,
    });

    console.log(`\n📅 Jövőbeli dátumok (2026+ ${futureDates.length}):`);
    futureDates.forEach((match) => {
      console.log(
        `  - ${match.homeTeam.name} vs ${match.awayTeam.name} (${match.date.toISOString().split('T')[0]})`,
      );
    });

    // 5. Leghosszabb csapat és liganevek
    const longNames = await prisma.team.findMany({
      where: {
        name: { not: { equals: '' } },
      },
      select: { name: true },
      orderBy: { name: 'desc' },
      take: 5,
    });

    console.log(`\n📏 Leghosszabb csapatnevek:`);
    longNames.forEach((team) => {
      if (team.name.length > 30) {
        console.log(`  - "${team.name}" (${team.name.length} karakter)`);
      }
    });

    // 6. Számoljuk meg az összes market és odds rekordot
    const totalMarkets = await prisma.market.count();
    const totalOdds = await prisma.odds.count();

    console.log(`\n📊 Statisztikák:`);
    console.log(`  - Meccsek: ${await prisma.match.count()}`);
    console.log(`  - Csapatok: ${await prisma.team.count()}`);
    console.log(`  - Ligák: ${await prisma.competition.count()}`);
    console.log(`  - Piacok: ${totalMarkets}`);
    console.log(`  - Odds: ${totalOdds}`);
  } catch (error) {
    console.error('Hiba az anomália keresésben:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findAnomalies();
