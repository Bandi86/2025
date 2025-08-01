import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { AgentTasksService } from './agent-tasks.service';
import { AgentEventsService } from './agent-events.service';
import { AgentInsightsService } from './agent-insights.service';
import { AgentWorkflowsService } from './agent-workflows.service';
import { AgentPerformanceService } from './agent-performance.service';
import { AgentIntegrationService } from './agent-integration.service';
import { DatabaseModule } from '../../common/database/database.module';
import { RedisModule } from '../../common/redis/redis.module';
import { LoggingModule } from '../../common/logging/logging.module';

@Module({
  imports: [
    DatabaseModule, // Fixed: Import DatabaseModule to provide PrismaService
    RedisModule, 
    LoggingModule
  ],
  controllers: [AgentsController],
  providers: [
    AgentsService,
    AgentTasksService,
    AgentEventsService,
    AgentInsightsService,
    AgentWorkflowsService,
    AgentPerformanceService,
    AgentIntegrationService,
  ],
  exports: [
    AgentsService,
    AgentTasksService,
    AgentEventsService,
    AgentInsightsService,
    AgentWorkflowsService,
    AgentPerformanceService,
    AgentIntegrationService,
  ],
})
export class AgentsModule {} 