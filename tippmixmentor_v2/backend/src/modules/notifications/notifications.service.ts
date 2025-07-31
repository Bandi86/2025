import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    metadata?: any;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        title: data.title,
        message: data.message,
        data: data.metadata,
      },
    });
  }

  async getUserNotifications(userId: string, limit = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { 
        userId,
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { 
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async deleteNotification(notificationId: string) {
    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  async getNotificationStats(userId: string) {
    const total = await this.prisma.notification.count({
      where: { userId },
    });

    const unread = await this.prisma.notification.count({
      where: { 
        userId,
        isRead: false,
      },
    });

    const byType = await this.prisma.notification.groupBy({
      by: ['type'],
      where: { userId },
      _count: {
        type: true,
      },
    });

    return {
      total,
      unread,
      byType,
    };
  }

  async createPredictionNotification(userId: string, matchId: string, predictionType: string) {
    return this.createNotification({
      userId,
      type: 'PREDICTION',
      title: 'New Prediction Available',
      message: `A new ${predictionType} prediction is available for match ${matchId}`,
      metadata: {
        matchId,
        predictionType,
      },
    });
  }

  async createMatchUpdateNotification(userId: string, matchId: string, updateType: string) {
    return this.createNotification({
      userId,
      type: 'MATCH_UPDATE',
      title: 'Match Update',
      message: `Match ${matchId} has been updated: ${updateType}`,
      metadata: {
        matchId,
        updateType,
      },
    });
  }

  async createSystemNotification(userId: string, title: string, message: string, metadata?: any) {
    return this.createNotification({
      userId,
      type: 'SYSTEM',
      title,
      message,
      metadata,
    });
  }

  async createAchievementNotification(userId: string, achievement: string) {
    return this.createNotification({
      userId,
      type: 'ACHIEVEMENT',
      title: 'Achievement Unlocked!',
      message: `Congratulations! You've unlocked: ${achievement}`,
      metadata: {
        achievement,
      },
    });
  }
} 