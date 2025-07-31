import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { AgentTasksService } from './agent-tasks.service';
import { AgentEventsService } from './agent-events.service';
import { AgentInsightsService } from './agent-insights.service';
import { AgentWorkflowsService } from './agent-workflows.service';
import { AgentPerformanceService } from './agent-performance.service';
import { AgentIntegrationService } from './agent-integration.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { CreateAgentTaskDto, TaskStatus } from './dto/agent-task.dto';
import { CreateAgentEventDto } from './agent-events.service';
import { CreateAgentInsightDto } from './agent-insights.service';
import { CreateAgentWorkflowDto } from './agent-workflows.service';
import { CreateAgentIntegrationDto } from './agent-integration.service';
import { AgentResponseDto } from './dto/agent-response.dto';
import { AgentTaskResponseDto } from './dto/agent-task.dto';
import { AgentEventResponseDto } from './agent-events.service';
import { AgentInsightResponseDto } from './agent-insights.service';
import { AgentWorkflowResponseDto } from './agent-workflows.service';
import { AgentIntegrationResponseDto } from './agent-integration.service';

// Create proper DTO classes for Swagger
class AgentEventResponseDtoClass {
  id: string;
  agentId: string;
  eventType: string;
  eventData?: Record<string, any>;
  severity: string;
  timestamp: Date;
}

class AgentInsightResponseDtoClass {
  id: string;
  agentId: string;
  insightType: string;
  content: string;
  confidence?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

class AgentWorkflowResponseDtoClass {
  id: string;
  agentId: string;
  name: string;
  description?: string;
  steps: Record<string, any>;
  status: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class AgentIntegrationResponseDtoClass {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agents')
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly agentTasksService: AgentTasksService,
    private readonly agentEventsService: AgentEventsService,
    private readonly agentInsightsService: AgentInsightsService,
    private readonly agentWorkflowsService: AgentWorkflowsService,
    private readonly agentPerformanceService: AgentPerformanceService,
    private readonly agentIntegrationService: AgentIntegrationService,
  ) {}

  // =============================================================================
  // Agent Management
  // =============================================================================

  @Post()
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Agent created successfully', type: AgentResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  create(@Body() createAgentDto: CreateAgentDto): Promise<AgentResponseDto> {
    return this.agentsService.create(createAgentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all agents' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of agents', type: [AgentResponseDto] })
  findAll(): Promise<AgentResponseDto[]> {
    return this.agentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agent details', type: AgentResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Agent not found' })
  findOne(@Param('id') id: string): Promise<AgentResponseDto> {
    return this.agentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update agent' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agent updated successfully', type: AgentResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Agent not found' })
  update(@Param('id') id: string, @Body() updateAgentDto: UpdateAgentDto): Promise<AgentResponseDto> {
    return this.agentsService.update(id, updateAgentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete agent' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Agent deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Agent not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.agentsService.remove(id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start agent' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agent started successfully', type: AgentResponseDto })
  startAgent(@Param('id') id: string): Promise<AgentResponseDto> {
    return this.agentsService.startAgent(id);
  }

  @Post(':id/stop')
  @ApiOperation({ summary: 'Stop agent' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agent stopped successfully', type: AgentResponseDto })
  stopAgent(@Param('id') id: string): Promise<AgentResponseDto> {
    return this.agentsService.stopAgent(id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get agent status from Agent OS' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agent status' })
  getAgentStatus(@Param('id') id: string): Promise<any> {
    return this.agentsService.getAgentStatus(id);
  }

  @Get(':id/health')
  @ApiOperation({ summary: 'Get agent health from Agent OS' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agent health' })
  getAgentHealth(@Param('id') id: string): Promise<any> {
    return this.agentsService.getAgentHealth(id);
  }

  // =============================================================================
  // Agent Tasks
  // =============================================================================

  @Post(':id/tasks')
  @ApiOperation({ summary: 'Create a new task for agent' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Task created successfully', type: AgentTaskResponseDto })
  createTask(
    @Param('id') agentId: string,
    @Body() createTaskDto: CreateAgentTaskDto,
  ): Promise<AgentTaskResponseDto> {
    return this.agentTasksService.create(agentId, createTaskDto);
  }

  @Get(':id/tasks')
  @ApiOperation({ summary: 'Get all tasks for agent' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of tasks', type: [AgentTaskResponseDto] })
  getTasks(
    @Param('id') agentId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<AgentTaskResponseDto[]> {
    return this.agentTasksService.findAll(agentId, limit, offset);
  }

  @Get(':id/tasks/:taskId')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task details', type: AgentTaskResponseDto })
  getTask(@Param('id') agentId: string, @Param('taskId') taskId: string): Promise<AgentTaskResponseDto> {
    return this.agentTasksService.findOne(agentId, taskId);
  }

  @Get(':id/tasks/:taskId/result')
  @ApiOperation({ summary: 'Get task result' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task result' })
  getTaskResult(@Param('id') agentId: string, @Param('taskId') taskId: string): Promise<any> {
    return this.agentTasksService.getTaskResult(agentId, taskId);
  }

  @Post(':id/tasks/:taskId/cancel')
  @ApiOperation({ summary: 'Cancel task' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task cancelled successfully', type: AgentTaskResponseDto })
  cancelTask(@Param('id') agentId: string, @Param('taskId') taskId: string): Promise<AgentTaskResponseDto> {
    return this.agentTasksService.cancelTask(agentId, taskId);
  }

  @Get(':id/tasks/status/:status')
  @ApiOperation({ summary: 'Get tasks by status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tasks by status', type: [AgentTaskResponseDto] })
  getTasksByStatus(
    @Param('id') agentId: string,
    @Param('status') status: TaskStatus,
  ): Promise<AgentTaskResponseDto[]> {
    return this.agentTasksService.getTasksByStatus(agentId, status);
  }

  // =============================================================================
  // Agent Events
  // =============================================================================

  @Post(':id/events')
  @ApiOperation({ summary: 'Create a new event for agent' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Event created successfully', type: AgentEventResponseDtoClass })
  createEvent(
    @Param('id') agentId: string,
    @Body() createEventDto: CreateAgentEventDto,
  ): Promise<AgentEventResponseDto> {
    return this.agentEventsService.create({ ...createEventDto, agentId });
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Get all events for agent' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of events', type: [AgentEventResponseDtoClass] })
  getEvents(
    @Param('id') agentId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<AgentEventResponseDto[]> {
    return this.agentEventsService.findAll(agentId, limit, offset);
  }

  @Get(':id/events/recent')
  @ApiOperation({ summary: 'Get recent events for agent' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Recent events', type: [AgentEventResponseDtoClass] })
  getRecentEvents(
    @Param('id') agentId: string,
    @Query('hours') hours?: number,
  ): Promise<AgentEventResponseDto[]> {
    return this.agentEventsService.getRecentEvents(agentId, hours);
  }

  @Get(':id/events/stats')
  @ApiOperation({ summary: 'Get event statistics for agent' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event statistics' })
  getEventStats(
    @Param('id') agentId: string,
    @Query('hours') hours?: number,
  ): Promise<any> {
    return this.agentEventsService.getEventStats(agentId, hours);
  }

  // =============================================================================
  // Agent Insights
  // =============================================================================

  @Post(':id/insights')
  @ApiOperation({ summary: 'Create a new insight for agent' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Insight created successfully', type: AgentInsightResponseDtoClass })
  createInsight(
    @Param('id') agentId: string,
    @Body() createInsightDto: CreateAgentInsightDto,
  ): Promise<AgentInsightResponseDto> {
    return this.agentInsightsService.create({ ...createInsightDto, agentId });
  }

  @Get(':id/insights')
  @ApiOperation({ summary: 'Get all insights for agent' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of insights', type: [AgentInsightResponseDtoClass] })
  getInsights(
    @Param('id') agentId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<AgentInsightResponseDto[]> {
    return this.agentInsightsService.findAll(agentId, limit, offset);
  }

  @Get(':id/insights/recent')
  @ApiOperation({ summary: 'Get recent insights for agent' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Recent insights', type: [AgentInsightResponseDtoClass] })
  getRecentInsights(
    @Param('id') agentId: string,
    @Query('hours') hours?: number,
  ): Promise<AgentInsightResponseDto[]> {
    return this.agentInsightsService.getRecentInsights(agentId, hours);
  }

  // =============================================================================
  // Agent Workflows
  // =============================================================================

  @Post(':id/workflows')
  @ApiOperation({ summary: 'Create a new workflow for agent' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Workflow created successfully', type: AgentWorkflowResponseDtoClass })
  createWorkflow(
    @Param('id') agentId: string,
    @Body() createWorkflowDto: CreateAgentWorkflowDto,
  ): Promise<AgentWorkflowResponseDto> {
    return this.agentWorkflowsService.create({ ...createWorkflowDto, agentId });
  }

  @Get(':id/workflows')
  @ApiOperation({ summary: 'Get all workflows for agent' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of workflows', type: [AgentWorkflowResponseDtoClass] })
  getWorkflows(@Param('id') agentId: string): Promise<AgentWorkflowResponseDto[]> {
    return this.agentWorkflowsService.findAll(agentId);
  }

  @Post(':id/workflows/:workflowId/toggle')
  @ApiOperation({ summary: 'Toggle workflow active status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Workflow status toggled', type: AgentWorkflowResponseDtoClass })
  toggleWorkflow(
    @Param('id') agentId: string,
    @Param('workflowId') workflowId: string,
  ): Promise<AgentWorkflowResponseDto> {
    return this.agentWorkflowsService.toggleActive(agentId, workflowId);
  }

  // =============================================================================
  // Agent Performance
  // =============================================================================

  @Get(':id/performance')
  @ApiOperation({ summary: 'Get agent performance metrics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agent performance' })
  getPerformance(@Param('id') agentId: string): Promise<any> {
    return this.agentPerformanceService.getPerformance(agentId);
  }

  // =============================================================================
  // Agent Integrations
  // =============================================================================

  @Post('integrations')
  @ApiOperation({ summary: 'Create a new agent integration' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Integration created successfully', type: AgentIntegrationResponseDtoClass })
  createIntegration(@Body() createIntegrationDto: CreateAgentIntegrationDto): Promise<AgentIntegrationResponseDto> {
    return this.agentIntegrationService.create(createIntegrationDto);
  }

  @Get('integrations')
  @ApiOperation({ summary: 'Get all agent integrations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of integrations', type: [AgentIntegrationResponseDtoClass] })
  getIntegrations(): Promise<AgentIntegrationResponseDto[]> {
    return this.agentIntegrationService.findAll();
  }

  @Get('integrations/:id')
  @ApiOperation({ summary: 'Get integration by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Integration details', type: AgentIntegrationResponseDtoClass })
  getIntegration(@Param('id') id: string): Promise<AgentIntegrationResponseDto> {
    return this.agentIntegrationService.findOne(id);
  }

  @Post('integrations/:id/toggle')
  @ApiOperation({ summary: 'Toggle integration active status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Integration status toggled', type: AgentIntegrationResponseDtoClass })
  toggleIntegration(@Param('id') id: string): Promise<AgentIntegrationResponseDto> {
    return this.agentIntegrationService.toggleActive(id);
  }
} 