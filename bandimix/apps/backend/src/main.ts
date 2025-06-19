import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ConsoleLogger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

declare const process: any;
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      prefix: 'NestJS',
      timestamp: true,
      logLevels: ['log', 'error', 'warn', 'debug', 'verbose'],
    }),
  });

  // CORS engedélyezése
  app.enableCors({
    origin: 'http://localhost:3000', // Csak a frontend címedet engedélyezd élesben!
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Globális Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Eltávolítja a DTO-ban nem definiált property-ket.
      transform: true, // Átalakítja a bejövő adatokat a DTO típusainak megfelelően.
    }),
  );
  // api prefix beállítása
  app.setGlobalPrefix('api');

  // Swagger (API Dokumentáció) beállítása
  const config = new DocumentBuilder()
    .setTitle('Az én Blog API-m')
    .setDescription('A Next.js frontendhez tartozó API leírása')
    .setVersion('1.0')
    .addBearerAuth() // JWT authentikációhoz
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Elérhető lesz a /api útvonalon

  await app.listen(process.env.PORT ?? 8000);

  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
