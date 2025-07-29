import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/database/prisma.service';
import { RedisService } from '../src/common/redis/redis.service';
import * as bcrypt from 'bcryptjs';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let redisService: RedisService;

  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    redisService = moduleFixture.get<RedisService>(RedisService);
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prismaService.user.deleteMany();
    await prismaService.refreshToken.deleteMany();
    
    // Clean up Redis
    await redisService.flushall();
  });

  afterAll(async () => {
    await prismaService.user.deleteMany();
    await prismaService.refreshToken.deleteMany();
    await redisService.flushall();
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body.user.username).toBe(testUser.username);
          expect(res.body.user.firstName).toBe(testUser.firstName);
          expect(res.body.user.lastName).toBe(testUser.lastName);
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should fail when email already exists', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      // Second registration with same email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('User with this email already exists');
        });
    });

    it('should fail when username already exists', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      // Second registration with same username but different email
      const duplicateUser = {
        ...testUser,
        email: 'different@example.com',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(duplicateUser)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('Username already taken');
        });
    });

    it('should fail with invalid email format', () => {
      const invalidUser = {
        ...testUser,
        email: 'invalid-email',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);
    });

    it('should fail with short password', () => {
      const invalidUser = {
        ...testUser,
        password: '123',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);
    });

    it('should fail with invalid username format', () => {
      const invalidUser = {
        ...testUser,
        username: 'invalid username',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);
    });

    it('should login successfully with correct credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should fail with incorrect password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid credentials');
        });
    });

    it('should fail with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid credentials');
        });
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: testUser.password,
        })
        .expect(400);
    });
  });

  describe('/auth/refresh (POST)', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register and login to get refresh token
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      refreshToken = response.body.refreshToken;
    });

    it('should refresh tokens successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.accessToken).not.toBe(refreshToken);
        });
    });

    it('should fail with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid refresh token');
        });
    });

    it('should fail with missing refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  describe('/auth/logout (POST)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get access token
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      accessToken = response.body.accessToken;
    });

    it('should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Logged out successfully');
        });
    });

    it('should fail without authorization header', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Protected routes', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get access token
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      accessToken = response.body.accessToken;
    });

    it('should access protected route with valid token', () => {
      return request(app.getHttpServer())
        .get('/users/profile') // Assuming this is a protected route
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should fail to access protected route without token', () => {
      return request(app.getHttpServer())
        .get('/users/profile')
        .expect(401);
    });

    it('should fail to access protected route with invalid token', () => {
      return request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Token refresh flow', () => {
    it('should maintain session after token refresh', async () => {
      // Register user
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      const originalAccessToken = registerResponse.body.accessToken;
      const refreshToken = registerResponse.body.refreshToken;

      // Use original access token
      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${originalAccessToken}`)
        .expect(200);

      // Refresh tokens
      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      const newAccessToken = refreshResponse.body.accessToken;

      // Use new access token
      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      // Old token should still work (until it expires)
      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${originalAccessToken}`)
        .expect(200);
    });
  });
}); 