import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { LoggingService } from './common/logging/logging.service';
import { MonitoringService } from './common/monitoring/monitoring.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { GlobalExceptionFilter } from './common/filters/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const loggingService = app.get(LoggingService);
  const monitoringService = app.get(MonitoringService);

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global interceptors and filters
  app.useGlobalInterceptors(new LoggingInterceptor(loggingService, monitoringService));
  app.useGlobalFilters(new GlobalExceptionFilter(loggingService, monitoringService));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  if (configService.get('ENABLE_SWAGGER', true)) {
    const config = new DocumentBuilder()
      .setTitle('TippMixMentor API Gateway')
      .setDescription('Football prediction system API gateway documentation')
      .setVersion('2.0.0')
      .addBearerAuth()
      .addTag('gateway', 'API Gateway endpoints')
      .addTag('health', 'Health check endpoints')
      .addTag('metrics', 'Performance metrics endpoints')
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management endpoints')
      .addTag('matches', 'Match data endpoints')
      .addTag('predictions', 'Prediction endpoints')
      .addTag('analytics', 'Analytics endpoints')
      .addTag('notifications', 'Notification endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get('API_PORT', 3001);
  await app.listen(port);

  loggingService.log(`🚀 API Gateway is running on: http://localhost:${port}`, 'MAIN');
  loggingService.log(`📚 API Documentation: http://localhost:${port}/api/docs`, 'MAIN');
  loggingService.log(`🏥 Health Check: http://localhost:${port}/health`, 'MAIN');
  loggingService.log(`📊 Metrics: http://localhost:${port}/metrics`, 'MAIN');
}

bootstrap(); 