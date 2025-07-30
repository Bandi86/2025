import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';

describe('MatchesService', () => {
  let service: MatchesService;
  let prismaService: PrismaService;

  const mockMatch = {
    id: 'match-1',
    homeTeamId: 'team-1',
    awayTeamId: 'team-2',
    leagueId: 'league-1',
    venueId: 'venue-1',
    season: '2024/25',
    matchDate: new Date('2024-12-31T20:00:00Z'),
    status: 'SCHEDULED' as const,
    homeScore: null,
    awayScore: null,
    homeHalfScore: null,
    awayHalfScore: null,
    referee: null,
    attendance: null,
    weather: null,
    temperature: null,
    humidity: null,
    windSpeed: null,
    isLive: false,
    isFinished: false,
    homeTeam: {
      id: 'team-1',
      name: 'Home Team',
      shortName: 'HOME',
      code: 'HT',
      country: 'Country',
      city: 'City',
      founded: 1900,
      logo: 'logo.png',
      venue: 'Home Stadium',
      capacity: 50000,
      leagueId: 'league-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    awayTeam: {
      id: 'team-2',
      name: 'Away Team',
      shortName: 'AWAY',
      code: 'AT',
      country: 'Country',
      city: 'City',
      founded: 1900,
      logo: 'logo.png',
      venue: 'Away Stadium',
      capacity: 50000,
      leagueId: 'league-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    league: {
      id: 'league-1',
      name: 'Test League',
      code: 'TL',
      country: 'Country',
      flag: 'flag.png',
      logo: 'logo.png',
      season: '2024/25',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    venue: {
      id: 'venue-1',
      name: 'Test Stadium',
      city: 'Test City',
      country: 'Test Country',
      capacity: 50000,
      surface: 'Grass',
      image: 'stadium.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    matchStats: null,
    predictions: [],
    keyEvents: [],
    plays: [],
    lineups: [],
    playerStats: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTeam = {
    id: 'team-1',
    name: 'Test Team',
    shortName: 'TEST',
    code: 'TT',
    country: 'Country',
    city: 'City',
    founded: 1900,
    logo: 'logo.png',
    venue: 'Test Stadium',
    capacity: 50000,
    leagueId: 'league-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLeague = {
    id: 'league-1',
    name: 'Test League',
    code: 'TL',
    country: 'Country',
    flag: 'flag.png',
    logo: 'logo.png',
    season: '2024/25',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        {
          provide: PrismaService,
          useValue: {
            match: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            team: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            league: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            matchStats: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all matches with pagination', async () => {
      const mockMatches = [mockMatch];
      jest.spyOn(prismaService.match, 'findMany').mockResolvedValue(mockMatches);
      jest.spyOn(prismaService.match, 'count').mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockMatches);
      expect(result.meta.total).toBe(1);
      expect(prismaService.match.findMany).toHaveBeenCalled();
    });

    it('should filter matches by league', async () => {
      const mockMatches = [mockMatch];
      jest.spyOn(prismaService.match, 'findMany').mockResolvedValue(mockMatches);
      jest.spyOn(prismaService.match, 'count').mockResolvedValue(1);

      await service.findAll({ leagueId: 'league-1' });

      expect(prismaService.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            leagueId: 'league-1',
          }),
        }),
      );
    });

    it('should filter matches by team', async () => {
      const mockMatches = [mockMatch];
      jest.spyOn(prismaService.match, 'findMany').mockResolvedValue(mockMatches);
      jest.spyOn(prismaService.match, 'count').mockResolvedValue(1);

      await service.findAll({ teamId: 'team-1' });

      expect(prismaService.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { homeTeamId: 'team-1' },
              { awayTeamId: 'team-1' },
            ],
          }),
        }),
      );
    });

    it('should filter matches by status', async () => {
      const mockMatches = [mockMatch];
      jest.spyOn(prismaService.match, 'findMany').mockResolvedValue(mockMatches);
      jest.spyOn(prismaService.match, 'count').mockResolvedValue(1);

      await service.findAll({ status: 'SCHEDULED' });

      expect(prismaService.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'SCHEDULED',
          }),
        }),
      );
    });

    it('should filter matches by date range', async () => {
      const mockMatches = [mockMatch];
      jest.spyOn(prismaService.match, 'findMany').mockResolvedValue(mockMatches);
      jest.spyOn(prismaService.match, 'count').mockResolvedValue(1);

      await service.findAll({ date: '2024-12-31' });

      expect(prismaService.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            matchDate: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a match by id', async () => {
      jest.spyOn(prismaService.match, 'findUnique').mockResolvedValue(mockMatch);

      const result = await service.findOne('match-1');

      expect(result).toEqual(mockMatch);
      expect(prismaService.match.findUnique).toHaveBeenCalledWith({
        where: { id: 'match-1' },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
          venue: true,
          matchStats: true,
          keyEvents: {
            orderBy: { minute: 'asc' },
          },
          lineups: true,
        },
      });
    });

    it('should throw NotFoundException if match not found', async () => {
      jest.spyOn(prismaService.match, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new match', async () => {
      const createMatchDto: CreateMatchDto = {
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        leagueId: 'league-1',
        venueId: 'venue-1',
        season: '2024/25',
        matchDate: '2024-12-31T20:00:00Z',
        status: 'SCHEDULED',
        homeScore: null,
        awayScore: null,
        homeHalfScore: null,
        awayHalfScore: null,
        referee: null,
        attendance: null,
        weather: null,
        temperature: null,
        humidity: null,
        windSpeed: null,
        isLive: false,
        isFinished: false,
      };

      jest.spyOn(prismaService.match, 'create').mockResolvedValue(mockMatch);

      const result = await service.create(createMatchDto);

      expect(result).toEqual(mockMatch);
      expect(prismaService.match.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          homeTeamId: 'team-1',
          awayTeamId: 'team-2',
          leagueId: 'league-1',
        }),
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
          venue: true,
        },
      });
    });

    it('should throw BadRequestException if home and away teams are the same', async () => {
      const createMatchDto: CreateMatchDto = {
        homeTeamId: 'team-1',
        awayTeamId: 'team-1',
        leagueId: 'league-1',
        venueId: 'venue-1',
        season: '2024/25',
        matchDate: '2024-12-31T20:00:00Z',
        status: 'SCHEDULED',
        homeScore: null,
        awayScore: null,
        homeHalfScore: null,
        awayHalfScore: null,
        referee: null,
        attendance: null,
        weather: null,
        temperature: null,
        humidity: null,
        windSpeed: null,
        isLive: false,
        isFinished: false,
      };

      await expect(service.create(createMatchDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update a match', async () => {
      const updateMatchDto = {
        homeScore: 2,
        awayScore: 1,
        status: 'FINISHED' as const,
      };

      jest.spyOn(prismaService.match, 'findUnique').mockResolvedValue(mockMatch);
      jest.spyOn(prismaService.match, 'update').mockResolvedValue({ ...mockMatch, ...updateMatchDto });

      const result = await service.update('match-1', updateMatchDto);

      expect(result).toEqual({ ...mockMatch, ...updateMatchDto });
      expect(prismaService.match.update).toHaveBeenCalledWith({
        where: { id: 'match-1' },
        data: updateMatchDto,
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
          venue: true,
        },
      });
    });

    it('should throw NotFoundException if match not found', async () => {
      const updateMatchDto: UpdateMatchDto = {
        homeScore: 2,
        awayScore: 1,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      await expect(service.update('nonexistent', updateMatchDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a match', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockMatch);
      jest.spyOn(prismaService.match, 'delete').mockResolvedValue(mockMatch);

      const result = await service.remove('match-1');

      expect(result).toEqual({ message: 'Match deleted successfully' });
      expect(prismaService.match.delete).toHaveBeenCalledWith({
        where: { id: 'match-1' },
      });
    });

    it('should throw NotFoundException if match not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException('Match with ID nonexistent not found'));

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findUpcomingMatches', () => {
    it('should return upcoming matches', async () => {
      const mockMatches = [mockMatch];
      jest.spyOn(prismaService.match, 'findMany').mockResolvedValue(mockMatches);

      const result = await service.findUpcomingMatches(10);

      expect(result).toEqual(mockMatches);
      expect(prismaService.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            matchDate: expect.any(Object),
            isFinished: false,
          }),
        }),
      );
    });
  });

  describe('findRecentMatches', () => {
    it('should return recent matches', async () => {
      const mockMatches = [mockMatch];
      jest.spyOn(prismaService.match, 'findMany').mockResolvedValue(mockMatches);

      const result = await service.findRecentMatches(10);

      expect(result).toEqual(mockMatches);
      expect(prismaService.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isFinished: true,
          }),
        }),
      );
    });
  });

  describe('findMatchesByTeam', () => {
    it('should return matches for a specific team', async () => {
      const mockMatches = [mockMatch];
      jest.spyOn(prismaService.match, 'findMany').mockResolvedValue(mockMatches);

      const result = await service.findMatchesByTeam('team-1', 10);

      expect(result).toEqual(mockMatches);
      expect(prismaService.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { homeTeamId: 'team-1' },
              { awayTeamId: 'team-1' },
            ],
          }),
        }),
      );
    });
  });

  describe('findMatchesByLeague', () => {
    it('should return matches for a specific league', async () => {
      const mockMatches = [mockMatch];
      jest.spyOn(prismaService.match, 'findMany').mockResolvedValue(mockMatches);

      const result = await service.findMatchesByLeague('league-1', 10);

      expect(result).toEqual(mockMatches);
      expect(prismaService.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            leagueId: 'league-1',
          }),
        }),
      );
    });
  });

  describe('updateMatchScore', () => {
    it('should update match score', async () => {
      const updatedMatch = { ...mockMatch, homeScore: 2, awayScore: 1, isFinished: true, status: 'FINISHED' as const };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockMatch);
      jest.spyOn(prismaService.match, 'update').mockResolvedValue(updatedMatch);

      const result = await service.updateMatchScore('match-1', 2, 1);

      expect(result).toEqual(updatedMatch);
      expect(prismaService.match.update).toHaveBeenCalledWith({
        where: { id: 'match-1' },
        data: {
          homeScore: 2,
          awayScore: 1,
          isFinished: true,
          status: 'FINISHED',
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
          venue: true,
        },
      });
    });

    it('should throw NotFoundException if match not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException('Match with ID nonexistent not found'));

      await expect(service.updateMatchScore('nonexistent', 2, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMatchStats', () => {
    it('should return match statistics', async () => {
      const mockMatchWithStats = {
        ...mockMatch,
        matchStats: {
          possession: { home: 60, away: 40 },
          shots: { home: 12, away: 8 },
          shotsOnTarget: { home: 6, away: 3 },
          corners: { home: 8, away: 4 },
          fouls: { home: 10, away: 12 },
          yellowCards: { home: 2, away: 3 },
          redCards: { home: 0, away: 0 },
        },
        playerStats: [],
      };

      jest.spyOn(prismaService.match, 'findUnique').mockResolvedValue(mockMatchWithStats);

      const result = await service.getMatchStats('match-1');

      expect(result).toHaveProperty('matchStats');
      expect(result).toHaveProperty('playerStats');
    });

    it('should throw NotFoundException if match not found', async () => {
      jest.spyOn(prismaService.match, 'findUnique').mockResolvedValue(null);

      await expect(service.getMatchStats('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createMatchStats', () => {
    it('should create match statistics', async () => {
      const createStatDto = {
        matchId: 'match-1',
        homePossession: 60,
        awayPossession: 40,
        homeShots: 12,
        awayShots: 8,
        homeShotsOnTarget: 6,
        awayShotsOnTarget: 3,
        homeCorners: 5,
        awayCorners: 3,
        homeFouls: 10,
        awayFouls: 12,
        homeYellowCards: 2,
        awayYellowCards: 1,
        homeRedCards: 0,
        awayRedCards: 0,
        homeOffsides: 3,
        awayOffsides: 2,
        homeSaves: 0,
        awaySaves: 0,
        homePasses: 450,
        awayPasses: 380,
        homePassAccuracy: 85,
        awayPassAccuracy: 78,
      };

      const mockStat = {
        id: 'stat-1',
        matchId: 'match-1',
        homePossession: 60,
        awayPossession: 40,
        homeShots: 12,
        awayShots: 8,
        homeShotsOnTarget: 6,
        awayShotsOnTarget: 3,
        homeCorners: 5,
        awayCorners: 3,
        homeFouls: 10,
        awayFouls: 12,
        homeYellowCards: 2,
        awayYellowCards: 1,
        homeRedCards: 0,
        awayRedCards: 0,
        homeOffsides: 3,
        awayOffsides: 2,
        homeSaves: 0,
        awaySaves: 0,
        homePasses: 450,
        awayPasses: 380,
        homePassAccuracy: 85,
        awayPassAccuracy: 78,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prismaService.matchStats, 'create').mockResolvedValue(mockStat);

      const result = await service.createMatchStats(createStatDto);

      expect(result).toEqual(mockStat);
      expect(prismaService.matchStats.create).toHaveBeenCalledWith({
        data: createStatDto,
      });
    });
  });

  describe('getTeams', () => {
    it('should return teams with optional filtering', async () => {
      const mockTeams = [mockTeam];
      jest.spyOn(prismaService.team, 'findMany').mockResolvedValue(mockTeams);

      const result = await service.getTeams({ leagueId: 'league-1' });

      expect(result).toEqual(mockTeams);
      expect(prismaService.team.findMany).toHaveBeenCalledWith({
        where: { leagueId: 'league-1' },
        include: { league: true },
        orderBy: { name: 'asc' },
      });
    });

    it('should return teams with search filter', async () => {
      const mockTeams = [mockTeam];
      jest.spyOn(prismaService.team, 'findMany').mockResolvedValue(mockTeams);

      const result = await service.getTeams({ search: 'Test' });

      expect(result).toEqual(mockTeams);
      expect(prismaService.team.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'Test', mode: 'insensitive' } },
            { shortName: { contains: 'Test', mode: 'insensitive' } },
            { code: { contains: 'Test', mode: 'insensitive' } },
          ],
        },
        include: { league: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getLeagues', () => {
    it('should return leagues', async () => {
      const mockLeagues = [mockLeague];
      jest.spyOn(prismaService.league, 'findMany').mockResolvedValue(mockLeagues);

      const result = await service.getLeagues();

      expect(result).toEqual(mockLeagues);
      expect(prismaService.league.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          _count: {
            select: {
              teams: true,
              matches: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    });
  });
}); 