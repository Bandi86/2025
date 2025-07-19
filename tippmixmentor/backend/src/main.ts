import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'verbose', 'debug'],
  });

  // Enable shutdown hooks
  app.enableShutdownHooks();

  Logger.log('Application started', 'Bootstrap');

  const config = new DocumentBuilder()
    .setTitle('TippmixMentor Backend API')
    .setDescription('API documentation for the TippmixMentor backend application')
    .setVersion('1.0')
    .addTag('Health')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
