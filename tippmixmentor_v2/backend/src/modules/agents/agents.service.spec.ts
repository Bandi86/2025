import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AgentsService } from './agents.service';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { LoggingService } from '../../common/logging/logging.service';
import { MonitoringService } from '../../common/monitoring/monitoring.service';
import { CreateAgentDto, AgentType } from './dto/create-agent.dto';
import { AgentStatus } from './dto/agent-response.dto';

// Mock axios
jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AgentsService', () => {
  let service: AgentsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    agent: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    agentPerformance: {
      create: jest.fn(),
    },
  };

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
  };

  const mockLoggingService = {
    log: jest.fn(),
    error: jest.fn(),
  };

  const mockMonitoringService = {
    recordMetric: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:8000'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: LoggingService,
          useValue: mockLoggingService,
        },
        {
          provide: MonitoringService,
          useValue: mockMonitoringService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new agent', async () => {
      const createAgentDto: CreateAgentDto = {
        name: 'Test Agent',
        agentType: AgentType.PREDICTION,
        config: { modelVersion: '1.0.0' },
      };

      const mockAgent = {
        id: 'test-id',
        name: 'Test Agent',
        agentType: AgentType.PREDICTION,
        status: AgentStatus.INACTIVE,
        config: { modelVersion: '1.0.0' },
        metadata: {},
        version: '1.0.0',
        isActive: true,
        lastHeartbeat: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.agent.create.mockResolvedValue(mockAgent);
      mockPrismaService.agentPerformance.create.mockResolvedValue({});
      
      // Mock axios calls
      mockedAxios.post.mockResolvedValue({
        data: { agent_id: 'os-agent-id' }
      });
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.create(createAgentDto);

      expect(mockPrismaService.agent.create).toHaveBeenCalledWith({
        data: {
          name: createAgentDto.name,
          agentType: createAgentDto.agentType,
          config: createAgentDto.config,
          metadata: {},
          version: '1.0.0',
          isActive: true,
          status: AgentStatus.INACTIVE,
        },
      });

      expect(result).toEqual({
        id: mockAgent.id,
        name: mockAgent.name,
        agentType: mockAgent.agentType,
        status: mockAgent.status,
        config: mockAgent.config,
        metadata: mockAgent.metadata,
        version: mockAgent.version,
        isActive: mockAgent.isActive,
        lastHeartbeat: mockAgent.lastHeartbeat,
        createdAt: mockAgent.createdAt,
        updatedAt: mockAgent.updatedAt,
      });
    });
  });

  describe('findAll', () => {
    it('should return all agents', async () => {
      const mockAgents = [
        {
          id: 'test-id-1',
          name: 'Test Agent 1',
          agentType: AgentType.PREDICTION,
          status: AgentStatus.ACTIVE,
          config: {},
          metadata: {},
          version: '1.0.0',
          isActive: true,
          lastHeartbeat: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          performance: {},
        },
      ];

      mockPrismaService.agent.findMany.mockResolvedValue(mockAgents);

      const result = await service.findAll();

      expect(mockPrismaService.agent.findMany).toHaveBeenCalledWith({
        include: {
          performance: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-id-1');
    });
  });

  describe('findOne', () => {
    it('should return a single agent', async () => {
      const mockAgent = {
        id: 'test-id',
        name: 'Test Agent',
        agentType: AgentType.PREDICTION,
        status: AgentStatus.ACTIVE,
        config: {},
        metadata: {},
        version: '1.0.0',
        isActive: true,
        lastHeartbeat: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        performance: {},
        tasks: [],
        events: [],
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);

      const result = await service.findOne('test-id');

      expect(mockPrismaService.agent.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        include: {
          performance: true,
          tasks: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          events: {
            orderBy: { timestamp: 'desc' },
            take: 10,
          },
        },
      });

      expect(result.id).toBe('test-id');
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow('Agent not found');
    });
  });
}); 