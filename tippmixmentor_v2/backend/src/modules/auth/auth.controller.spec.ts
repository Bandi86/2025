import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER' as const,
  };

  const mockAuthResponse = {
    user: mockUser,
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  const mockTokens = {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            refreshToken: jest.fn(),
            logout: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return user data and tokens on successful login', async () => {
      jest.spyOn(authService, 'login').mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
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

    it('should return user data and tokens on successful registration', async () => {
      jest.spyOn(authService, 'register').mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should return new tokens on successful refresh', async () => {
      jest.spyOn(authService, 'refreshToken').mockResolvedValue(mockTokens);

      const result = await controller.refreshToken(refreshTokenDto);

      expect(result).toEqual(mockTokens);
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto);
    });
  });

  describe('logout', () => {
    it('should return success message on logout', async () => {
      const mockRequest = {
        user: { id: 'user-1' },
      };
      const logoutResponse = { message: 'Logged out successfully' };

      jest.spyOn(authService, 'logout').mockResolvedValue(logoutResponse);

      const result = await controller.logout(mockRequest);

      expect(result).toEqual(logoutResponse);
      expect(authService.logout).toHaveBeenCalledWith('user-1');
    });
  });
}); 