import { Module } from '@nestjs/common';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { SocialGateway } from './social.gateway';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SocialController],
  providers: [SocialService, SocialGateway],
  exports: [SocialService, SocialGateway],
})
export class SocialModule {} 