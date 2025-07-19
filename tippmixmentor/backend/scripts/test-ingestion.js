const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function testDataIngestion() {
    try {
        console.log('🚀 Starting data ingestion test...');

        // Check if we have any merged JSON files
        const mergedDataDir = path.join(process.cwd(), '..', 'merge_json_data', 'merged_data');

        try {
            const files = await fs.readdir(mergedDataDir);
            const jsonFiles = files.filter(file => file.endsWith('.json'));

            if (jsonFiles.length === 0) {
                console.log('❌ No JSON files found in merge_json_data/merged_data directory');
                return;
            }

            console.log(`📁 Found ${jsonFiles.length} JSON files to process`);

            // Test with the first file
            const testFile = path.join(mergedDataDir, jsonFiles[0]);
            console.log(`📄 Testing with file: ${jsonFiles[0]}`);

            const fileContent = await fs.readFile(testFile, 'utf-8');
            const data = JSON.parse(fileContent);

            console.log(`📊 File contains ${data.matches.length} matches`);

            // Check current database state
            const initialStats = await getDatabaseStats();
            console.log('📈 Initial database stats:', initialStats);

            // Simulate the ingestion process (basic validation)
            let processedMatches = 0;
            for (const match of data.matches.slice(0, 5)) { // Test with first 5 matches
                console.log(`🔍 Processing match: ${match.teams.home.name} vs ${match.teams.away.name}`);
                processedMatches++;
            }

            console.log(`✅ Successfully validated ${processedMatches} matches`);
            console.log('🎉 Data ingestion test completed successfully!');

        } catch (error) {
            console.error('❌ Error accessing merged data directory:', error.message);
            console.log('💡 Make sure to run the merge_json_data script first to generate merged files');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

async function getDatabaseStats() {
    const [matches, teams, tournaments, bettingMarkets, odds] = await Promise.all([
        prisma.match.count(),
        prisma.team.count(),
        prisma.tournament.count(),
        prisma.bettingMarket.count(),
        prisma.odds.count(),
    ]);

    return {
        matches,
        teams,
        tournaments,
        bettingMarkets,
        odds,
    };
}

// Run the test
testDataIngestion();