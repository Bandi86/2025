import { Module } from '@nestjs/common';
import { DbDebuggerController } from './db-debugger.controller';
import { DbDebuggerService } from './db-debugger.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DbDebuggerController],
  providers: [DbDebuggerService],
  exports: [DbDebuggerService],
})
export class DbDebuggerModule {}