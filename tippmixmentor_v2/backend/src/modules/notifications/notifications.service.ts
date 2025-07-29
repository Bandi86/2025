import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId: string, params: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: string;
  }) {
    const { page = 1, limit = 10, isRead, type } = params;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { unreadCount: count };
  }

  async findOne(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async create(userId: string, createNotificationDto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        type: createNotificationDto.type as any,
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        data: createNotificationDto.data,
        userId,
      },
    });
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      message: `Marked ${result.count} notifications as read`,
      updatedCount: result.count,
    };
  }

  async remove(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    return { message: 'Notification deleted successfully' };
  }

  async clearRead(userId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
      },
    });

    return {
      message: `Cleared ${result.count} read notifications`,
      deletedCount: result.count,
    };
  }

  // System methods for creating notifications
  async createMatchStartNotification(userId: string, matchData: any) {
    return this.create(userId, {
      type: 'MATCH_START',
      title: 'Match Starting Soon',
      message: `${matchData.homeTeam.name} vs ${matchData.awayTeam.name} is starting in 30 minutes!`,
      data: {
        matchId: matchData.id,
        homeTeam: matchData.homeTeam.name,
        awayTeam: matchData.awayTeam.name,
        matchDate: matchData.matchDate,
      },
    });
  }

  async createPredictionResultNotification(userId: string, predictionData: any) {
    const isCorrect = predictionData.isCorrect ? 'correct' : 'incorrect';
    return this.create(userId, {
      type: 'PREDICTION_RESULT',
      title: 'Prediction Result',
      message: `Your prediction for ${predictionData.match.homeTeam.name} vs ${predictionData.match.awayTeam.name} was ${isCorrect}!`,
      data: {
        predictionId: predictionData.id,
        matchId: predictionData.matchId,
        isCorrect: predictionData.isCorrect,
        homeTeam: predictionData.match.homeTeam.name,
        awayTeam: predictionData.match.awayTeam.name,
      },
    });
  }

  async createAchievementNotification(userId: string, achievementData: any) {
    return this.create(userId, {
      type: 'ACHIEVEMENT',
      title: 'Achievement Unlocked!',
      message: `Congratulations! You've unlocked the "${achievementData.name}" achievement!`,
      data: {
        achievementId: achievementData.id,
        achievementName: achievementData.name,
        description: achievementData.description,
      },
    });
  }

  async createSystemUpdateNotification(userId: string, updateData: any) {
    return this.create(userId, {
      type: 'SYSTEM_UPDATE',
      title: 'System Update',
      message: updateData.message,
      data: {
        updateType: updateData.type,
        version: updateData.version,
        details: updateData.details,
      },
    });
  }

  async createGeneralNotification(userId: string, title: string, message: string, data?: any) {
    return this.create(userId, {
      type: 'GENERAL',
      title,
      message,
      data,
    });
  }

  // Batch notification methods
  async createBatchNotifications(userIds: string[], notificationData: CreateNotificationDto) {
    const notifications = [];

    for (const userId of userIds) {
      try {
        const notification = await this.create(userId, notificationData);
        notifications.push(notification);
      } catch (error) {
        console.error(`Failed to create notification for user ${userId}:`, error.message);
      }
    }

    return {
      created: notifications.length,
      failed: userIds.length - notifications.length,
      notifications,
    };
  }

  // Cleanup old notifications
  async cleanupOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        isRead: true,
      },
    });

    return {
      message: `Cleaned up ${result.count} old notifications`,
      deletedCount: result.count,
    };
  }
} 