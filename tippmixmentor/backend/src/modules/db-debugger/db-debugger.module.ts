import { Module } from '@nestjs/common';
import { DbDebuggerController } from './db-debugger.controller';
import { DbDebuggerService } from './db-debugger.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { QueryMonitorService } from './services/query-monitor.service';
import { ConnectionPoolMonitorService } from './services/connection-pool-monitor.service';
import { AlertService } from './services/alert.service';

@Module({
  imports: [PrismaModule],
  controllers: [DbDebuggerController],
  providers: [
    DbDebuggerService,
    QueryMonitorService,
    ConnectionPoolMonitorService,
    AlertService,
  ],
  exports: [
    DbDebuggerService,
    QueryMonitorService,
    ConnectionPoolMonitorService,
    AlertService,
  ],
})
export class DbDebuggerModule {}