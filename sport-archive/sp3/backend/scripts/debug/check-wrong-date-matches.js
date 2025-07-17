const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkWrongDateMatches() {
  console.log('🔍 Checking matches with wrong dates...');

  // Check Mexikó vs Honduras (should be today July 4, showing as yesterday July 3)
  console.log('\n=== MEXIKÓ VS HONDURAS ===');
  const mexicoMatch = await prisma.match.findFirst({
    where: {
      homeTeam: { name: { contains: 'mexiko', mode: 'insensitive' } },
      awayTeam: { name: { contains: 'honduras', mode: 'insensitive' } },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      competition: true,
    },
  });

  if (mexicoMatch) {
    console.log(
      `📅 Match: ${mexicoMatch.homeTeam.name} vs ${mexicoMatch.awayTeam.name}`,
    );
    console.log(`🏆 Competition: ${mexicoMatch.competition.name}`);
    console.log(`📅 Stored in DB (UTC): ${mexicoMatch.date.toISOString()}`);

    // Calculate Budapest time
    const utcHour = mexicoMatch.date.getUTCHours();
    const utcMinute = mexicoMatch.date.getUTCMinutes();
    const budapestHour = (utcHour + 2) % 24;
    console.log(
      `📅 Budapest time: ${budapestHour}:${utcMinute.toString().padStart(2, '0')}`,
    );

    // Check what day it shows
    const utcDate = mexicoMatch.date.toISOString().split('T')[0];
    console.log(`📅 UTC date: ${utcDate}`);

    // What should it be? 04:00 Budapest on July 4 = 02:00 UTC on July 4
    console.log('\n📄 Expected:');
    console.log('📅 04:00 Budapest on July 4, 2025');
    console.log('📅 Should be stored as: 02:00 UTC on July 4, 2025');
    console.log('📅 Expected UTC: 2025-07-04T02:00:00.000Z');

    if (mexicoMatch.date.toISOString() === '2025-07-04T02:00:00.000Z') {
      console.log('✅ CORRECT: Match is stored correctly');
    } else {
      console.log('❌ INCORRECT: Match is stored wrong');
      console.log(`   Expected: 2025-07-04T02:00:00.000Z`);
      console.log(`   Actual: ${mexicoMatch.date.toISOString()}`);
    }
  } else {
    console.log('❌ Mexikó vs Honduras match not found');
  }

  // Check New York City FC vs Toronto FC (should be today July 4, showing as July 3)
  console.log('\n=== NEW YORK CITY FC VS TORONTO FC ===');
  const nycMatch = await prisma.match.findFirst({
    where: {
      homeTeam: { name: { contains: 'new york city', mode: 'insensitive' } },
      awayTeam: { name: { contains: 'toronto', mode: 'insensitive' } },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      competition: true,
    },
  });

  if (nycMatch) {
    console.log(
      `📅 Match: ${nycMatch.homeTeam.name} vs ${nycMatch.awayTeam.name}`,
    );
    console.log(`🏆 Competition: ${nycMatch.competition.name}`);
    console.log(`📅 Stored in DB (UTC): ${nycMatch.date.toISOString()}`);

    // Calculate Budapest time
    const utcHour = nycMatch.date.getUTCHours();
    const utcMinute = nycMatch.date.getUTCMinutes();
    const budapestHour = (utcHour + 2) % 24;
    console.log(
      `📅 Budapest time: ${budapestHour}:${utcMinute.toString().padStart(2, '0')}`,
    );

    // Check what day it shows
    const utcDate = nycMatch.date.toISOString().split('T')[0];
    console.log(`📅 UTC date: ${utcDate}`);

    // What should it be? 01:30 Budapest on July 4 = 23:30 UTC on July 3
    console.log('\n📄 Expected:');
    console.log('📅 01:30 Budapest on July 4, 2025');
    console.log('📅 Should be stored as: 23:30 UTC on July 3, 2025');
    console.log('📅 Expected UTC: 2025-07-03T23:30:00.000Z');

    if (nycMatch.date.toISOString() === '2025-07-03T23:30:00.000Z') {
      console.log('✅ CORRECT: Match is stored correctly');
    } else {
      console.log('❌ INCORRECT: Match is stored wrong');
      console.log(`   Expected: 2025-07-03T23:30:00.000Z`);
      console.log(`   Actual: ${nycMatch.date.toISOString()}`);
    }
  } else {
    console.log('❌ New York City FC vs Toronto FC match not found');
  }

  // Check Birmingham Legion vs Charleston
  console.log('\n=== BIRMINGHAM LEGION VS CHARLESTON ===');
  const birminghamMatch = await prisma.match.findFirst({
    where: {
      homeTeam: { name: { contains: 'birmingham', mode: 'insensitive' } },
      awayTeam: { name: { contains: 'charleston', mode: 'insensitive' } },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      competition: true,
    },
  });

  if (birminghamMatch) {
    console.log(
      `📅 Match: ${birminghamMatch.homeTeam.name} vs ${birminghamMatch.awayTeam.name}`,
    );
    console.log(`🏆 Competition: ${birminghamMatch.competition.name}`);
    console.log(`📅 Stored in DB (UTC): ${birminghamMatch.date.toISOString()}`);

    // Calculate Budapest time
    const utcHour = birminghamMatch.date.getUTCHours();
    const utcMinute = birminghamMatch.date.getUTCMinutes();
    const budapestHour = (utcHour + 2) % 24;
    console.log(
      `📅 Budapest time: ${budapestHour}:${utcMinute.toString().padStart(2, '0')}`,
    );

    // Check what day it shows
    const utcDate = birminghamMatch.date.toISOString().split('T')[0];
    console.log(`📅 UTC date: ${utcDate}`);

    // What should it be? 02:00 Budapest on July 4 = 00:00 UTC on July 4
    console.log('\n📄 Expected:');
    console.log('📅 02:00 Budapest on July 4, 2025');
    console.log('📅 Should be stored as: 00:00 UTC on July 4, 2025');
    console.log('📅 Expected UTC: 2025-07-04T00:00:00.000Z');

    if (birminghamMatch.date.toISOString() === '2025-07-04T00:00:00.000Z') {
      console.log('✅ CORRECT: Match is stored correctly');
    } else {
      console.log('❌ INCORRECT: Match is stored wrong');
      console.log(`   Expected: 2025-07-04T00:00:00.000Z`);
      console.log(`   Actual: ${birminghamMatch.date.toISOString()}`);
    }
  } else {
    console.log('❌ Birmingham Legion vs Charleston match not found');
  }

  await prisma.$disconnect();
}

checkWrongDateMatches().catch(console.error);
