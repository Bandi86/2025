import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'User notifications retrieved successfully' })
  async getUserNotifications(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.notificationsService.getUserNotifications(userId, limitNum);
  }

  @Get('user/:userId/unread')
  @ApiOperation({ summary: 'Get unread notifications' })
  @ApiResponse({ status: 200, description: 'Unread notifications retrieved successfully' })
  async getUnreadNotifications(@Param('userId') userId: string) {
    return this.notificationsService.getUnreadNotifications(userId);
  }

  @Get('user/:userId/stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({ status: 200, description: 'Notification statistics retrieved successfully' })
  async getNotificationStats(@Param('userId') userId: string) {
    return this.notificationsService.getNotificationStats(userId);
  }

  @Put(':notificationId/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read successfully' })
  async markAsRead(@Param('notificationId') notificationId: string) {
    return this.notificationsService.markAsRead(notificationId);
  }

  @Put('user/:userId/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read successfully' })
  async markAllAsRead(@Param('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':notificationId')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  async deleteNotification(@Param('notificationId') notificationId: string) {
    return this.notificationsService.deleteNotification(notificationId);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, description: 'Notification created successfully' })
  async createNotification(@Body() notificationData: {
    userId: string;
    type: string;
    title: string;
    message: string;
    metadata?: any;
  }) {
    return this.notificationsService.createNotification(notificationData);
  }

  @Post('prediction')
  @ApiOperation({ summary: 'Create prediction notification' })
  @ApiResponse({ status: 201, description: 'Prediction notification created successfully' })
  async createPredictionNotification(@Body() data: {
    userId: string;
    matchId: string;
    predictionType: string;
  }) {
    return this.notificationsService.createPredictionNotification(
      data.userId,
      data.matchId,
      data.predictionType,
    );
  }

  @Post('match-update')
  @ApiOperation({ summary: 'Create match update notification' })
  @ApiResponse({ status: 201, description: 'Match update notification created successfully' })
  async createMatchUpdateNotification(@Body() data: {
    userId: string;
    matchId: string;
    updateType: string;
  }) {
    return this.notificationsService.createMatchUpdateNotification(
      data.userId,
      data.matchId,
      data.updateType,
    );
  }

  @Post('system')
  @ApiOperation({ summary: 'Create system notification' })
  @ApiResponse({ status: 201, description: 'System notification created successfully' })
  async createSystemNotification(@Body() data: {
    userId: string;
    title: string;
    message: string;
    metadata?: any;
  }) {
    return this.notificationsService.createSystemNotification(
      data.userId,
      data.title,
      data.message,
      data.metadata,
    );
  }

  @Post('achievement')
  @ApiOperation({ summary: 'Create achievement notification' })
  @ApiResponse({ status: 201, description: 'Achievement notification created successfully' })
  async createAchievementNotification(@Body() data: {
    userId: string;
    achievement: string;
  }) {
    return this.notificationsService.createAchievementNotification(
      data.userId,
      data.achievement,
    );
  }
} 