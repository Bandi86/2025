import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe with strict settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      // Enhanced validation options
      skipMissingProperties: false,
      skipNullProperties: false,
      skipUndefinedProperties: false,
      forbidUnknownValues: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Request size limits
  app.use((req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        statusCode: 413,
        message: 'Request entity too large',
        errorCode: 'REQUEST_TOO_LARGE',
        timestamp: new Date().toISOString(),
      });
    }
    next();
  });

  // Swagger documentation
  if (configService.get('ENABLE_SWAGGER', true)) {
    const config = new DocumentBuilder()
      .setTitle('TippMixMentor API')
      .setDescription('Football prediction system API documentation')
      .setVersion('2.0.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management endpoints')
      .addTag('health', 'Health check endpoints')
      .addTag('agents', 'AI Agent management endpoints')
      .addTag('predictions', 'Match prediction endpoints')
      .addTag('football-data', 'Football data endpoints')
      .addTag('analytics', 'Analytics and insights endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get('API_PORT', 3001);
  await app.listen(port);

  console.log(`🚀 API is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🏥 Health Check: http://localhost:${port}/health`);
  console.log(`📊 Metrics: http://localhost:${port}/metrics`);
}

bootstrap(); 