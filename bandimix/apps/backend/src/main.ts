import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

declare const process: any;
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 8000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
