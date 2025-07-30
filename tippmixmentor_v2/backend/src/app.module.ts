import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Database
import { DatabaseModule } from './common/database/database.module';
import { PrismaService } from './common/database/prisma.service';

// Feature modules - only essential ones
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

// Controllers
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    DatabaseModule,

    // JWT
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),

    // Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Feature modules - minimal set
    AuthModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {} 