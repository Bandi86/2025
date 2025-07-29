import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  All,
  Req,
  Res,
  HttpStatus,
  Query,
  Param,
  Body,
  Headers,
  UseGuards,
  UseInterceptors,
  UseFilters,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { GatewayService } from './gateway.service';
import { LoggingService } from '../common/logging/logging.service';
import { MonitoringService } from '../common/monitoring/monitoring.service';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';
import { GlobalExceptionFilter } from '../common/filters/exception.filter';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';

@Controller()
@UseInterceptors(LoggingInterceptor)
@UseFilters(GlobalExceptionFilter)
export class GatewayController {
  constructor(
    private gatewayService: GatewayService,
    private loggingService: LoggingService,
    private monitoringService: MonitoringService,
  ) {}

  @Get('health')
  async healthCheck() {
    return this.monitoringService.getHealthCheck();
  }

  @Get('metrics')
  async getMetrics() {
    return this.monitoringService.getPerformanceMetrics();
  }

  @Get('gateway/test')
  async testGateway() {
    return {
      message: 'Gateway is working!',
      timestamp: new Date().toISOString(),
      services: this.gatewayService.getServices(),
    };
  }

  @Get('api/v1/*')
  async handleGetRequest(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: any,
    @Param() params: any,
    @Headers() headers: any,
  ) {
    return this.gatewayService.routeRequest(req, res, 'GET');
  }

  @Post('api/v1/*')
  async handlePostRequest(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
    @Headers() headers: any,
  ) {
    return this.gatewayService.routeRequest(req, res, 'POST');
  }

  @Put('api/v1/*')
  async handlePutRequest(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
    @Headers() headers: any,
  ) {
    return this.gatewayService.routeRequest(req, res, 'PUT');
  }

  @Patch('api/v1/*')
  async handlePatchRequest(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
    @Headers() headers: any,
  ) {
    return this.gatewayService.routeRequest(req, res, 'PATCH');
  }

  @Delete('api/v1/*')
  async handleDeleteRequest(
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: any,
  ) {
    return this.gatewayService.routeRequest(req, res, 'DELETE');
  }

  @All('api/v1/*')
  async handleAllRequests(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.gatewayService.routeRequest(req, res, req.method);
  }

  // Catch-all route for unmatched paths
  @All('*')
  async handleUnmatchedRoutes(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.loggingService.warn('Unmatched route accessed', 'GATEWAY', {
      method: req.method,
      url: req.url,
      ip: req.ip,
    });

    return res.status(HttpStatus.NOT_FOUND).json({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Route not found',
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
} 