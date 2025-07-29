import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    avatar: null,
    role: 'USER' as const,
    isEmailVerified: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithoutPassword = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'John',
    lastName: 'Doe',
    avatar: null,
    role: 'USER' as const,
    isEmailVerified: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    password: 'hashedPassword', // Include password for Prisma type compatibility
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            userStats: {
              findUnique: jest.fn(),
            },
            userPreferences: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('should create a new user', async () => {
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: createUserDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      jest.spyOn(prismaService.user, 'findMany').mockResolvedValue([mockUserWithoutPassword]);

      const result = await service.findAll();

      expect(result).toEqual([mockUserWithoutPassword]);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.findById('nonexistent')).rejects.toThrow('User with ID nonexistent not found');
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user not found by email', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
    });
  });

  describe('findByUsername', () => {
    it('should return user when found by username', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('should return null when user not found by username', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');

      expect(result).toBeNull();
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'nonexistent' },
      });
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update user when found', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser);

      const result = await service.update('user-1', updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(service.findById).toHaveBeenCalledWith('user-1');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: updateUserDto,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(service, 'findById').mockRejectedValue(new NotFoundException('User not found'));

      await expect(service.update('nonexistent', updateUserDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete user when found', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'delete').mockResolvedValue(mockUser);

      const result = await service.remove('user-1');

      expect(result).toEqual(mockUser);
      expect(service.findById).toHaveBeenCalledWith('user-1');
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(service, 'findById').mockRejectedValue(new NotFoundException('User not found'));

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserStats', () => {
    const mockUserStats = {
      id: 'stats-1',
      userId: 'user-1',
      totalPredictions: 10,
      correctPredictions: 7,
      accuracy: 0.7,
      streak: 3,
      bestStreak: 5,
      totalPoints: 100,
      rank: 15,
      lastPredictionDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return user stats when found', async () => {
      jest.spyOn(prismaService.userStats, 'findUnique').mockResolvedValue(mockUserStats);

      const result = await service.getUserStats('user-1');

      expect(result).toEqual(mockUserStats);
      expect(prismaService.userStats.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should return null when user stats not found', async () => {
      jest.spyOn(prismaService.userStats, 'findUnique').mockResolvedValue(null);

      const result = await service.getUserStats('user-1');

      expect(result).toBeNull();
      expect(prismaService.userStats.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });

  describe('getUserPreferences', () => {
    const mockUserPreferences = {
      id: 'prefs-1',
      userId: 'user-1',
      favoriteTeams: ['team-1', 'team-2'],
      favoriteLeagues: ['league-1'],
      notificationSettings: { email: true, push: false },
      theme: 'dark',
      language: 'en',
      timezone: 'UTC',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return user preferences when found', async () => {
      jest.spyOn(prismaService.userPreferences, 'findUnique').mockResolvedValue(mockUserPreferences);

      const result = await service.getUserPreferences('user-1');

      expect(result).toEqual(mockUserPreferences);
      expect(prismaService.userPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should return null when user preferences not found', async () => {
      jest.spyOn(prismaService.userPreferences, 'findUnique').mockResolvedValue(null);

      const result = await service.getUserPreferences('user-1');

      expect(result).toBeNull();
      expect(prismaService.userPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });
}); 