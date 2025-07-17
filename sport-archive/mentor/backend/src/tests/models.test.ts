import {
    TeamSchema, CreateTeamSchema,
    MatchSchema, CreateMatchSchema,
    MatchStatSchema, CreateMatchStatSchema,
    PredictionSchema, CreatePredictionSchema
} from '../models';

describe('Sports Data Models', () => {
    describe('Team Model', () => {
        test('should validate valid team data', () => {
            const validTeam = {
                id: 1,
                name: 'Manchester United',
                country: 'England',
                league: 'Premier League'
            };

            expect(() => TeamSchema.parse(validTeam)).not.toThrow();
        });

        test('should validate team creation data', () => {
            const validCreateTeam = {
                name: 'Barcelona',
                country: 'Spain',
                league: 'La Liga'
            };

            expect(() => CreateTeamSchema.parse(validCreateTeam)).not.toThrow();
        });

        test('should reject invalid team data', () => {
            const invalidTeam = {
                id: 1,
                name: '',
                country: 'England',
                league: 'Premier League'
            };

            expect(() => TeamSchema.parse(invalidTeam)).toThrow();
        });
    });

    describe('Match Model', () => {
        test('should validate valid match data', () => {
            const validMatch = {
                id: 1,
                match_date: '2024-01-15T15:00:00Z',
                home_team_id: 1,
                away_team_id: 2,
                home_score: 2,
                away_score: 1,
                status: 'completed' as const
            };

            expect(() => MatchSchema.parse(validMatch)).not.toThrow();
        });

        test('should reject match with same home and away team', () => {
            const invalidMatch = {
                id: 1,
                match_date: '2024-01-15T15:00:00Z',
                home_team_id: 1,
                away_team_id: 1,
                status: 'scheduled' as const
            };

            expect(() => MatchSchema.parse(invalidMatch)).toThrow();
        });
    });

    describe('MatchStat Model', () => {
        test('should validate valid match stat data', () => {
            const validMatchStat = {
                id: 1,
                match_id: 1,
                stat_name: 'possession',
                home_value: 65.5,
                away_value: 34.5
            };

            expect(() => MatchStatSchema.parse(validMatchStat)).not.toThrow();
        });

        test('should validate match stat creation data', () => {
            const validCreateMatchStat = {
                match_id: 1,
                stat_name: 'shots_on_target',
                home_value: 8,
                away_value: 3
            };

            expect(() => CreateMatchStatSchema.parse(validCreateMatchStat)).not.toThrow();
        });
    });

    describe('Prediction Model', () => {
        test('should validate valid prediction data', () => {
            const validPrediction = {
                id: 1,
                match_id: 1,
                model_version: 'v1.0',
                predicted_outcome: '1' as const,
                probability: 0.65
            };

            expect(() => PredictionSchema.parse(validPrediction)).not.toThrow();
        });

        test('should reject invalid probability', () => {
            const invalidPrediction = {
                id: 1,
                match_id: 1,
                model_version: 'v1.0',
                predicted_outcome: '1' as const,
                probability: 1.5
            };

            expect(() => PredictionSchema.parse(invalidPrediction)).toThrow();
        });
    });
});