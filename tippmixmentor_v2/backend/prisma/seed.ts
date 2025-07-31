import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create leagues
  const premierLeague = await prisma.league.upsert({
    where: { code: 'PL' },
    update: {},
    create: {
      name: 'Premier League',
      code: 'PL',
      country: 'England',
      flag: '🇬🇧',
      logo: 'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.png',
      season: '2024/25',
    },
  });

  const laLiga = await prisma.league.upsert({
    where: { code: 'LL' },
    update: {},
    create: {
      name: 'La Liga',
      code: 'LL',
      country: 'Spain',
      flag: '🇪🇸',
      logo: 'https://upload.wikimedia.org/wikipedia/en/1/13/LaLiga.svg',
      season: '2024/25',
    },
  });

  const bundesliga = await prisma.league.upsert({
    where: { code: 'BL' },
    update: {},
    create: {
      name: 'Bundesliga',
      code: 'BL',
      country: 'Germany',
      flag: '🇩🇪',
      logo: 'https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg',
      season: '2024/25',
    },
  });

  console.log('✅ Leagues created');

  // Create venues
  const venues = await Promise.all([
    prisma.venue.upsert({
      where: { id: 'venue-1' },
      update: {},
      create: {
        id: 'venue-1',
        name: 'Old Trafford',
        city: 'Manchester',
        country: 'England',
        capacity: 74140,
        surface: 'Grass',
      },
    }),
    prisma.venue.upsert({
      where: { id: 'venue-2' },
      update: {},
      create: {
        id: 'venue-2',
        name: 'Anfield',
        city: 'Liverpool',
        country: 'England',
        capacity: 53394,
        surface: 'Grass',
      },
    }),
    prisma.venue.upsert({
      where: { id: 'venue-3' },
      update: {},
      create: {
        id: 'venue-3',
        name: 'Camp Nou',
        city: 'Barcelona',
        country: 'Spain',
        capacity: 99354,
        surface: 'Grass',
      },
    }),
    prisma.venue.upsert({
      where: { id: 'venue-4' },
      update: {},
      create: {
        id: 'venue-4',
        name: 'Santiago Bernabéu',
        city: 'Madrid',
        country: 'Spain',
        capacity: 81044,
        surface: 'Grass',
      },
    }),
    prisma.venue.upsert({
      where: { id: 'venue-5' },
      update: {},
      create: {
        id: 'venue-5',
        name: 'Allianz Arena',
        city: 'Munich',
        country: 'Germany',
        capacity: 75000,
        surface: 'Grass',
      },
    }),
  ]);

  console.log('✅ Venues created');

  // Create teams
  const teams = await Promise.all([
    // Premier League teams
    prisma.team.upsert({
      where: { code: 'MUN' },
      update: {},
      create: {
        name: 'Manchester United',
        shortName: 'Man Utd',
        code: 'MUN',
        country: 'England',
        city: 'Manchester',
        founded: 1878,
        logo: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
        venue: 'Old Trafford',
        capacity: 74140,
        leagueId: premierLeague.id,
      },
    }),
    prisma.team.upsert({
      where: { code: 'LIV' },
      update: {},
      create: {
        name: 'Liverpool',
        shortName: 'Liverpool',
        code: 'LIV',
        country: 'England',
        city: 'Liverpool',
        founded: 1892,
        logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
        venue: 'Anfield',
        capacity: 53394,
        leagueId: premierLeague.id,
      },
    }),
    prisma.team.upsert({
      where: { code: 'MCI' },
      update: {},
      create: {
        name: 'Manchester City',
        shortName: 'Man City',
        code: 'MCI',
        country: 'England',
        city: 'Manchester',
        founded: 1880,
        logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
        venue: 'Etihad Stadium',
        capacity: 53400,
        leagueId: premierLeague.id,
      },
    }),
    prisma.team.upsert({
      where: { code: 'ARS' },
      update: {},
      create: {
        name: 'Arsenal',
        shortName: 'Arsenal',
        code: 'ARS',
        country: 'England',
        city: 'London',
        founded: 1886,
        logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
        venue: 'Emirates Stadium',
        capacity: 60704,
        leagueId: premierLeague.id,
      },
    }),
    // La Liga teams
    prisma.team.upsert({
      where: { code: 'BAR' },
      update: {},
      create: {
        name: 'Barcelona',
        shortName: 'Barça',
        code: 'BAR',
        country: 'Spain',
        city: 'Barcelona',
        founded: 1899,
        logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
        venue: 'Camp Nou',
        capacity: 99354,
        leagueId: laLiga.id,
      },
    }),
    prisma.team.upsert({
      where: { code: 'RMA' },
      update: {},
      create: {
        name: 'Real Madrid',
        shortName: 'Real Madrid',
        code: 'RMA',
        country: 'Spain',
        city: 'Madrid',
        founded: 1902,
        logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
        venue: 'Santiago Bernabéu',
        capacity: 81044,
        leagueId: laLiga.id,
      },
    }),
    // Bundesliga teams
    prisma.team.upsert({
      where: { code: 'BAY' },
      update: {},
      create: {
        name: 'Bayern Munich',
        shortName: 'Bayern',
        code: 'BAY',
        country: 'Germany',
        city: 'Munich',
        founded: 1900,
        logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
        venue: 'Allianz Arena',
        capacity: 75000,
        leagueId: bundesliga.id,
      },
    }),
  ]);

  console.log('✅ Teams created');

  // Create some players
  const players = await Promise.all([
    prisma.player.upsert({
      where: { id: 'player-1' },
      update: {},
      create: {
        id: 'player-1',
        name: 'Marcus Rashford',
        firstName: 'Marcus',
        lastName: 'Rashford',
        position: 'Forward',
        nationality: 'England',
        dateOfBirth: new Date('1997-10-31'),
        height: 180,
        weight: 70,
        jerseyNumber: 10,
        teamId: teams[0].id, // Manchester United
      },
    }),
    prisma.player.upsert({
      where: { id: 'player-2' },
      update: {},
      create: {
        id: 'player-2',
        name: 'Mohamed Salah',
        firstName: 'Mohamed',
        lastName: 'Salah',
        position: 'Forward',
        nationality: 'Egypt',
        dateOfBirth: new Date('1992-06-15'),
        height: 175,
        weight: 71,
        jerseyNumber: 11,
        teamId: teams[1].id, // Liverpool
      },
    }),
    prisma.player.upsert({
      where: { id: 'player-3' },
      update: {},
      create: {
        id: 'player-3',
        name: 'Erling Haaland',
        firstName: 'Erling',
        lastName: 'Haaland',
        position: 'Forward',
        nationality: 'Norway',
        dateOfBirth: new Date('2000-07-21'),
        height: 194,
        weight: 88,
        jerseyNumber: 9,
        teamId: teams[2].id, // Manchester City
      },
    }),
  ]);

  console.log('✅ Players created');

  // Create matches
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const matches = await Promise.all([
    // Live match
    prisma.match.upsert({
      where: { id: 'live-match-1' },
      update: {},
      create: {
        id: 'live-match-1',
        homeTeamId: teams[0].id, // Manchester United
        awayTeamId: teams[1].id, // Liverpool
        leagueId: premierLeague.id,
        venueId: venues[0].id,
        season: '2024/25',
        matchDate: now,
        status: 'LIVE',
        isLive: true,
        isFinished: false,
        homeScore: 1,
        awayScore: 2,
      },
    }),
    // Upcoming match
    prisma.match.upsert({
      where: { id: 'upcoming-match-1' },
      update: {},
      create: {
        id: 'upcoming-match-1',
        homeTeamId: teams[2].id, // Manchester City
        awayTeamId: teams[3].id, // Arsenal
        leagueId: premierLeague.id,
        venueId: venues[0].id,
        season: '2024/25',
        matchDate: tomorrow,
        status: 'SCHEDULED',
        isLive: false,
        isFinished: false,
      },
    }),
    // Future match
    prisma.match.upsert({
      where: { id: 'future-match-1' },
      update: {},
      create: {
        id: 'future-match-1',
        homeTeamId: teams[4].id, // Barcelona
        awayTeamId: teams[5].id, // Real Madrid
        leagueId: laLiga.id,
        venueId: venues[2].id,
        season: '2024/25',
        matchDate: nextWeek,
        status: 'SCHEDULED',
        isLive: false,
        isFinished: false,
      },
    }),
  ]);

  console.log('✅ Matches created');

  // Create match stats for the live match
  await prisma.matchStats.upsert({
    where: { matchId: matches[0].id },
    update: {},
    create: {
      matchId: matches[0].id,
      homePossession: 45,
      awayPossession: 55,
      homeShots: 8,
      awayShots: 12,
      homeShotsOnTarget: 3,
      awayShotsOnTarget: 5,
      homeCorners: 4,
      awayCorners: 6,
      homeFouls: 12,
      awayFouls: 10,
      homeYellowCards: 2,
      awayYellowCards: 1,
      homeRedCards: 0,
      awayRedCards: 0,
    },
  });

  console.log('✅ Match stats created');

  // Create some predictions
  const predictions = await Promise.all([
    prisma.prediction.upsert({
      where: { id: 'prediction-1' },
      update: {},
      create: {
        id: 'prediction-1',
        userId: 'cmdrni21t0000pf019bkyx6z2', // Test user ID
        matchId: matches[0].id,
        modelVersion: 'v1.0.0',
        homeWinProb: 0.35,
        drawProb: 0.25,
        awayWinProb: 0.40,
        predictedScore: '1-2',
        confidence: 75,
        features: {
          homeForm: 0.6,
          awayForm: 0.8,
          homeGoals: 1.2,
          awayGoals: 2.1,
          headToHead: 0.4,
        },
        predictionType: 'MATCH_RESULT',
        insight: 'Liverpool has been in excellent form recently, scoring consistently. Manchester United has struggled defensively.',
        bettingRecommendations: {
          recommendedBet: 'Away Win',
          confidence: 75,
          stake: 100,
          odds: 2.5,
          potentialWinnings: 250,
        },
        isCorrect: null, // Not determined yet
      },
    }),
    prisma.prediction.upsert({
      where: { id: 'prediction-2' },
      update: {},
      create: {
        id: 'prediction-2',
        userId: 'cmdrni21t0000pf019bkyx6z2',
        matchId: matches[1].id,
        modelVersion: 'v1.0.0',
        homeWinProb: 0.65,
        drawProb: 0.20,
        awayWinProb: 0.15,
        predictedScore: '3-1',
        confidence: 85,
        features: {
          homeForm: 0.9,
          awayForm: 0.7,
          homeGoals: 2.8,
          awayGoals: 1.5,
          headToHead: 0.6,
        },
        predictionType: 'MATCH_RESULT',
        insight: 'Manchester City has been dominant at home this season. Arsenal has improved but may struggle away.',
        bettingRecommendations: {
          recommendedBet: 'Home Win',
          confidence: 85,
          stake: 150,
          odds: 1.8,
          potentialWinnings: 270,
        },
        isCorrect: null,
      },
    }),
  ]);

  console.log('✅ Predictions created');

  // Create some agents
  const agents = await Promise.all([
    prisma.agent.upsert({
      where: { id: 'agent-1' },
      update: {},
      create: {
        id: 'agent-1',
        name: 'Market Analysis Agent',
        agentType: 'ANALYTICS',
        status: 'ACTIVE',
        config: {
          analysisDepth: 'DEEP',
          updateFrequency: 'REAL_TIME',
          riskTolerance: 'MODERATE',
        },
        metadata: {
          description: 'Analyzes betting markets and identifies value opportunities',
        },
      },
    }),
    prisma.agent.upsert({
      where: { id: 'agent-2' },
      update: {},
      create: {
        id: 'agent-2',
        name: 'Risk Assessment Agent',
        agentType: 'ANALYTICS',
        status: 'ACTIVE',
        config: {
          analysisDepth: 'COMPREHENSIVE',
          updateFrequency: 'HOURLY',
          riskTolerance: 'CONSERVATIVE',
        },
        metadata: {
          description: 'Evaluates risk factors and provides risk-adjusted recommendations',
        },
      },
    }),
  ]);

  console.log('✅ Agents created');

  // Create agent performance records
  await Promise.all([
    prisma.agentPerformance.upsert({
      where: { agentId: agents[0].id },
      update: {},
      create: {
        agentId: agents[0].id,
        totalTasks: 150,
        completedTasks: 118,
        failedTasks: 32,
        averageResponseTime: 2.5,
        successRate: 78.5,
        uptime: 95.2,
        lastActivity: new Date(),
      },
    }),
    prisma.agentPerformance.upsert({
      where: { agentId: agents[1].id },
      update: {},
      create: {
        agentId: agents[1].id,
        totalTasks: 89,
        completedTasks: 76,
        failedTasks: 13,
        averageResponseTime: 1.8,
        successRate: 85.2,
        uptime: 98.1,
        lastActivity: new Date(),
      },
    }),
  ]);

  console.log('✅ Agent performance created');

  console.log('🎉 Database seeding completed successfully!');
  console.log(`📊 Created: ${teams.length} teams, ${matches.length} matches, ${predictions.length} predictions, ${agents.length} agents`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 