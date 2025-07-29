import { Test, TestingModule } from '@nestjs/testing';
import { PredictionsService } from './prediction.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/database/prisma.service';

describe('PredictionsService Integration', () => {
  let service: PredictionsService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictionsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ML_SERVICE_URL') return 'http://localhost:8000';
              return null;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            match: {
              findUnique: jest.fn().mockResolvedValue({
                id: '1',
                homeTeam: { id: '123', name: 'Team A' },
                awayTeam: { id: '456', name: 'Team B' },
                matchDate: new Date('2024-01-15T20:00:00Z'),
                league: { name: 'Test League' },
              }),
            },
            prediction: {
              create: jest.fn().mockResolvedValue({
                id: 'pred-1',
                matchId: '1',
                userId: 'user-1',
                modelVersion: '1.0.0',
                homeWinProb: 0.4,
                drawProb: 0.3,
                awayWinProb: 0.3,
                predictedScore: '2-1',
                confidence: 0.6,
                predictionType: 'MATCH_RESULT',
                createdAt: new Date(),
                updatedAt: new Date(),
              }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PredictionsService>(PredictionsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should check ML service status', async () => {
    const status = await service.getMLServiceStatus();
    expect(status).toHaveProperty('status');
  });

  it('should create a prediction', async () => {
    const prediction = await service.createPrediction(
      {
        matchId: '1',
        predictionType: 'MATCH_RESULT',
        modelVersion: '1.0.0',
        homeWinProb: 0.4,
        drawProb: 0.3,
        awayWinProb: 0.3,
        confidence: 0.6,
      },
      'user-1'
    );

    expect(prediction).toBeDefined();
    expect(prediction.matchId).toBe('1');
    expect(prediction.userId).toBe('user-1');
  });

  it('should get prediction statistics', async () => {
    const stats = await service.getPredictionStats('user-1');
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('accuracy');
  });
}); 