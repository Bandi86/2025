import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config'
import { ConsoleLogger } from '@nestjs/common';

declare const process: any;
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      prefix: 'NestJS',
      timestamp: true,
      logLevels: ['log', 'error', 'warn', 'debug', 'verbose'],
    })
  });

  // Get the ConfigService
  const configService = app.get(ConfigService);

  await app.listen(process.env.PORT ?? 8000);

  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
