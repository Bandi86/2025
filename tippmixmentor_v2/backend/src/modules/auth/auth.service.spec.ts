import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let prismaService: PrismaService;
  let redisService: RedisService;

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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findByUsername: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await service.validateUser(email, password);

      expect(result).toEqual(expect.objectContaining({
        id: mockUserWithoutPassword.id,
        email: mockUserWithoutPassword.email,
        username: mockUserWithoutPassword.username,
        firstName: mockUserWithoutPassword.firstName,
        lastName: mockUserWithoutPassword.lastName,
        avatar: mockUserWithoutPassword.avatar,
        isEmailVerified: mockUserWithoutPassword.isEmailVerified,
        isActive: mockUserWithoutPassword.isActive,
        role: mockUserWithoutPassword.role,
      }));
      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
    });

    it('should return null when user is not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should return null when password is incorrect', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return user data and tokens when login is successful', async () => {
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUserWithoutPassword);
      jest.spyOn(service as any, 'generateTokens').mockResolvedValue(mockTokens);
      jest.spyOn(service as any, 'saveRefreshToken').mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
        },
        ...mockTokens,
      });
      expect(service['saveRefreshToken']).toHaveBeenCalledWith(mockUser.id, mockTokens.refreshToken);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('should create new user and return user data with tokens', async () => {
      const hashedPassword = 'hashedPassword123';
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      const newUser = { ...mockUser, ...registerDto, password: hashedPassword };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'findByUsername').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve(hashedPassword));
      jest.spyOn(usersService, 'create').mockResolvedValue(newUser);
      jest.spyOn(service as any, 'generateTokens').mockResolvedValue(mockTokens);
      jest.spyOn(service as any, 'saveRefreshToken').mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
        },
        ...mockTokens,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(usersService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: hashedPassword,
      });
      expect(service['saveRefreshToken']).toHaveBeenCalledWith(newUser.id, mockTokens.refreshToken);
    });

    it('should throw ConflictException when email already exists', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow('User with this email already exists');
    });

    it('should throw ConflictException when username already exists', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'findByUsername').mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow('Username already taken');
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should return new tokens when refresh token is valid', async () => {
      const payload = { sub: 'user-1', email: 'test@example.com', role: 'USER' };
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest.spyOn(configService, 'get').mockReturnValue('refresh-secret');
      jest.spyOn(redisService, 'get').mockResolvedValue(refreshTokenDto.refreshToken);
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(service as any, 'generateTokens').mockResolvedValue(mockTokens);
      jest.spyOn(service as any, 'saveRefreshToken').mockResolvedValue(undefined);

      const result = await service.refreshToken(refreshTokenDto);

      expect(result).toEqual(mockTokens);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(refreshTokenDto.refreshToken, {
        secret: 'refresh-secret',
      });
      expect(redisService.get).toHaveBeenCalledWith(`refresh_token:${payload.sub}`);
      expect(service['saveRefreshToken']).toHaveBeenCalledWith(mockUser.id, mockTokens.refreshToken);
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Invalid token'));

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw UnauthorizedException when stored token does not match', async () => {
      const payload = { sub: 'user-1', email: 'test@example.com', role: 'USER' };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest.spyOn(configService, 'get').mockReturnValue('refresh-secret');
      jest.spyOn(redisService, 'get').mockResolvedValue('different-token');

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const payload = { sub: 'user-1', email: 'test@example.com', role: 'USER' };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest.spyOn(configService, 'get').mockReturnValue('refresh-secret');
      jest.spyOn(redisService, 'get').mockResolvedValue(refreshTokenDto.refreshToken);
      jest.spyOn(usersService, 'findById').mockResolvedValue(null);

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout', () => {
    it('should delete refresh token and return success message', async () => {
      const userId = 'user-1';

      jest.spyOn(redisService, 'del').mockResolvedValue(1);

      const result = await service.logout(userId);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(redisService.del).toHaveBeenCalledWith(`refresh_token:${userId}`);
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';

      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce(accessToken);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce(refreshToken);
      jest.spyOn(configService, 'get').mockReturnValue('refresh-secret');

      const result = await service['generateTokens'](mockUser);

      expect(result).toEqual({ accessToken, refreshToken });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('saveRefreshToken', () => {
    it('should save refresh token to Redis with correct TTL', async () => {
      const userId = 'user-1';
      const refreshToken = 'refresh-token';
      const expiresIn = '7d';

      jest.spyOn(configService, 'get').mockReturnValue(expiresIn);
      jest.spyOn(redisService, 'set').mockResolvedValue('OK');

      await service['saveRefreshToken'](userId, refreshToken);

      expect(configService.get).toHaveBeenCalledWith('JWT_REFRESH_EXPIRES_IN', '7d');
      expect(redisService.set).toHaveBeenCalledWith(`refresh_token:${userId}`, refreshToken, 7 * 24 * 60 * 60);
    });
  });

  describe('parseDuration', () => {
    it('should parse seconds correctly', () => {
      const result = service['parseDuration']('30s');
      expect(result).toBe(30);
    });

    it('should parse minutes correctly', () => {
      const result = service['parseDuration']('15m');
      expect(result).toBe(15 * 60);
    });

    it('should parse hours correctly', () => {
      const result = service['parseDuration']('2h');
      expect(result).toBe(2 * 60 * 60);
    });

    it('should parse days correctly', () => {
      const result = service['parseDuration']('7d');
      expect(result).toBe(7 * 24 * 60 * 60);
    });

    it('should return default value for invalid format', () => {
      const result = service['parseDuration']('invalid');
      expect(result).toBe(7 * 24 * 60 * 60);
    });
  });
}); 