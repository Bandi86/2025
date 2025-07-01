import {
  PrismaClient,
  CompetitionType,
  MatchStatus,
  DataSource,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Competitions
  const competitions = await Promise.all([
    prisma.competition.create({
      data: {
        name: 'Premier League',
        shortName: 'PL',
        country: 'England',
        type: CompetitionType.LEAGUE,
        tier: 1,
        season: '2024/25',
      },
    }),
    prisma.competition.create({
      data: {
        name: 'Bundesliga',
        shortName: 'BL',
        country: 'Germany',
        type: CompetitionType.LEAGUE,
        tier: 1,
        season: '2024/25',
      },
    }),
    prisma.competition.create({
      data: {
        name: 'Champions League',
        shortName: 'UCL',
        country: 'Europe',
        type: CompetitionType.INTERNATIONAL,
        tier: 1,
        season: '2024/25',
      },
    }),
  ]);

  console.log('✅ Created competitions:', competitions.length);

  // Teams
  const teams = await Promise.all([
    // Premier League teams
    prisma.team.create({
      data: {
        name: 'Manchester United',
        shortName: 'Man Utd',
        alternativeNames: ['MUFC', 'Manchester United FC'],
        city: 'Manchester',
        country: 'England',
        founded: 1878,
        stadium: 'Old Trafford',
      },
    }),
    prisma.team.create({
      data: {
        name: 'Arsenal',
        shortName: 'Arsenal',
        alternativeNames: ['Arsenal FC', 'The Gunners'],
        city: 'London',
        country: 'England',
        founded: 1886,
        stadium: 'Emirates Stadium',
      },
    }),
    prisma.team.create({
      data: {
        name: 'Liverpool',
        shortName: 'Liverpool',
        alternativeNames: ['Liverpool FC', 'LFC'],
        city: 'Liverpool',
        country: 'England',
        founded: 1892,
        stadium: 'Anfield',
      },
    }),
    prisma.team.create({
      data: {
        name: 'Manchester City',
        shortName: 'Man City',
        alternativeNames: ['MCFC', 'City'],
        city: 'Manchester',
        country: 'England',
        founded: 1880,
        stadium: 'Etihad Stadium',
      },
    }),
    // Bundesliga teams
    prisma.team.create({
      data: {
        name: 'Bayern Munich',
        shortName: 'Bayern',
        alternativeNames: ['FC Bayern München', 'FCB'],
        city: 'Munich',
        country: 'Germany',
        founded: 1900,
        stadium: 'Allianz Arena',
      },
    }),
    prisma.team.create({
      data: {
        name: 'Borussia Dortmund',
        shortName: 'Dortmund',
        alternativeNames: ['BVB', 'Borussia Dortmund'],
        city: 'Dortmund',
        country: 'Germany',
        founded: 1909,
        stadium: 'Signal Iduna Park',
      },
    }),
  ]);

  console.log('✅ Created teams:', teams.length);

  // Competition-Team relationships
  const premierLeague = competitions[0];
  const bundesliga = competitions[1];
  const championsLeague = competitions[2];

  await Promise.all([
    // Premier League teams
    prisma.competitionTeam.create({
      data: {
        competitionId: premierLeague.id,
        teamId: teams[0].id, // Man Utd
        season: '2024/25',
      },
    }),
    prisma.competitionTeam.create({
      data: {
        competitionId: premierLeague.id,
        teamId: teams[1].id, // Arsenal
        season: '2024/25',
      },
    }),
    prisma.competitionTeam.create({
      data: {
        competitionId: premierLeague.id,
        teamId: teams[2].id, // Liverpool
        season: '2024/25',
      },
    }),
    prisma.competitionTeam.create({
      data: {
        competitionId: premierLeague.id,
        teamId: teams[3].id, // Man City
        season: '2024/25',
      },
    }),
    // Bundesliga teams
    prisma.competitionTeam.create({
      data: {
        competitionId: bundesliga.id,
        teamId: teams[4].id, // Bayern
        season: '2024/25',
      },
    }),
    prisma.competitionTeam.create({
      data: {
        competitionId: bundesliga.id,
        teamId: teams[5].id, // Dortmund
        season: '2024/25',
      },
    }),
    // Champions League (some teams)
    prisma.competitionTeam.create({
      data: {
        competitionId: championsLeague.id,
        teamId: teams[1].id, // Arsenal
        season: '2024/25',
      },
    }),
    prisma.competitionTeam.create({
      data: {
        competitionId: championsLeague.id,
        teamId: teams[2].id, // Liverpool
        season: '2024/25',
      },
    }),
    prisma.competitionTeam.create({
      data: {
        competitionId: championsLeague.id,
        teamId: teams[4].id, // Bayern
        season: '2024/25',
      },
    }),
    prisma.competitionTeam.create({
      data: {
        competitionId: championsLeague.id,
        teamId: teams[5].id, // Dortmund
        season: '2024/25',
      },
    }),
  ]);

  console.log('✅ Created competition-team relationships');

  // Matches
  const matches = await Promise.all([
    // Premier League matches
    prisma.match.create({
      data: {
        date: new Date('2025-01-15T15:00:00Z'),
        homeTeamId: teams[0].id, // Man Utd
        awayTeamId: teams[1].id, // Arsenal
        competitionId: premierLeague.id,
        round: 22,
        matchday: 22,
        season: '2024/25',
        venue: 'Old Trafford',
        homeScore: 2,
        awayScore: 1,
        status: MatchStatus.FINISHED,
        sourceType: DataSource.MANUAL_INPUT,
        manualVerified: true,
      },
    }),
    prisma.match.create({
      data: {
        date: new Date('2025-01-18T17:30:00Z'),
        homeTeamId: teams[2].id, // Liverpool
        awayTeamId: teams[3].id, // Man City
        competitionId: premierLeague.id,
        round: 23,
        matchday: 23,
        season: '2024/25',
        venue: 'Anfield',
        status: MatchStatus.SCHEDULED,
        sourceType: DataSource.MANUAL_INPUT,
        prediction: {
          homeWin: 0.45,
          draw: 0.25,
          awayWin: 0.3,
          overUnder: {
            over25: 0.75,
            under25: 0.25,
          },
        },
        confidence: 0.72,
      },
    }),
    // Bundesliga match
    prisma.match.create({
      data: {
        date: new Date('2025-01-20T18:30:00Z'),
        homeTeamId: teams[4].id, // Bayern
        awayTeamId: teams[5].id, // Dortmund
        competitionId: bundesliga.id,
        round: 19,
        matchday: 19,
        season: '2024/25',
        venue: 'Allianz Arena',
        status: MatchStatus.SCHEDULED,
        sourceType: DataSource.MANUAL_INPUT,
        prediction: {
          homeWin: 0.55,
          draw: 0.2,
          awayWin: 0.25,
        },
        confidence: 0.68,
      },
    }),
    // Champions League match
    prisma.match.create({
      data: {
        date: new Date('2025-02-18T21:00:00Z'),
        homeTeamId: teams[1].id, // Arsenal
        awayTeamId: teams[4].id, // Bayern
        competitionId: championsLeague.id,
        round: 1,
        season: '2024/25',
        venue: 'Emirates Stadium',
        status: MatchStatus.SCHEDULED,
        sourceType: DataSource.MANUAL_INPUT,
        notes: 'Champions League Round of 16 - First Leg',
      },
    }),
  ]);

  console.log('✅ Created matches:', matches.length);

  // League Table (example for Premier League)
  await Promise.all([
    prisma.leagueTable.create({
      data: {
        competitionId: premierLeague.id,
        teamId: teams[2].id, // Liverpool
        matchday: 22,
        season: '2024/25',
        position: 1,
        points: 50,
        played: 22,
        won: 15,
        drawn: 5,
        lost: 2,
        goalsFor: 48,
        goalsAgainst: 18,
        goalDifference: 30,
        form: 'WWDWW',
        sourceType: DataSource.MANUAL_INPUT,
      },
    }),
    prisma.leagueTable.create({
      data: {
        competitionId: premierLeague.id,
        teamId: teams[1].id, // Arsenal
        matchday: 22,
        season: '2024/25',
        position: 2,
        points: 47,
        played: 22,
        won: 14,
        drawn: 5,
        lost: 3,
        goalsFor: 45,
        goalsAgainst: 22,
        goalDifference: 23,
        form: 'WLWWW',
        sourceType: DataSource.MANUAL_INPUT,
      },
    }),
    prisma.leagueTable.create({
      data: {
        competitionId: premierLeague.id,
        teamId: teams[3].id, // Man City
        matchday: 22,
        season: '2024/25',
        position: 3,
        points: 45,
        played: 21,
        won: 14,
        drawn: 3,
        lost: 4,
        goalsFor: 52,
        goalsAgainst: 28,
        goalDifference: 24,
        form: 'WWLWD',
        sourceType: DataSource.MANUAL_INPUT,
      },
    }),
    prisma.leagueTable.create({
      data: {
        competitionId: premierLeague.id,
        teamId: teams[0].id, // Man Utd
        matchday: 22,
        season: '2024/25',
        position: 7,
        points: 32,
        played: 22,
        won: 9,
        drawn: 5,
        lost: 8,
        goalsFor: 32,
        goalsAgainst: 28,
        goalDifference: 4,
        form: 'WLDLW',
        sourceType: DataSource.MANUAL_INPUT,
      },
    }),
  ]);

  console.log('✅ Created league table entries');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
