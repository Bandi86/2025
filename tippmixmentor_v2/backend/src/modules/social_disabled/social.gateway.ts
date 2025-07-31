import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Logger } from '@nestjs/common';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/social',
})
export class SocialGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocialGateway.name);
  private connectedUsers = new Map<string, AuthenticatedSocket>();

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract user info from handshake auth
      const token = client.handshake.auth.token;
      if (token) {
        // In a real implementation, you would verify the JWT token here
        // For now, we'll use a simple approach
        const userInfo = this.extractUserFromToken(token);
        if (userInfo) {
          client.userId = userInfo.userId;
          client.username = userInfo.username;
          this.connectedUsers.set(userInfo.userId, client);
          
          this.logger.log(`User ${userInfo.username} connected to social gateway`);
          
          // Join user's personal room
          await client.join(`user:${userInfo.userId}`);
          
          // Emit connection status
          client.emit('connected', {
            message: 'Connected to social gateway',
            userId: userInfo.userId,
            username: userInfo.username,
          });
        }
      }
    } catch (error) {
      this.logger.error('Error handling connection:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`User ${client.username} disconnected from social gateway`);
    }
  }

  @SubscribeMessage('join_feed')
  async handleJoinFeed(
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    await client.join('social_feed');
    client.emit('joined_feed', { message: 'Joined social feed' });
  }

  @SubscribeMessage('leave_feed')
  async handleLeaveFeed(
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    await client.leave('social_feed');
    client.emit('left_feed', { message: 'Left social feed' });
  }

  @SubscribeMessage('join_user_posts')
  async handleJoinUserPosts(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { username: string },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    await client.join(`user_posts:${data.username}`);
    client.emit('joined_user_posts', { 
      message: `Joined ${data.username}'s posts`,
      username: data.username,
    });
  }

  @SubscribeMessage('leave_user_posts')
  async handleLeaveUserPosts(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { username: string },
  ) {
    await client.leave(`user_posts:${data.username}`);
    client.emit('left_user_posts', { 
      message: `Left ${data.username}'s posts`,
      username: data.username,
    });
  }

  @SubscribeMessage('join_post_comments')
  async handleJoinPostComments(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { postId: string },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    await client.join(`post_comments:${data.postId}`);
    client.emit('joined_post_comments', { 
      message: `Joined post ${data.postId} comments`,
      postId: data.postId,
    });
  }

  @SubscribeMessage('leave_post_comments')
  async handleLeavePostComments(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { postId: string },
  ) {
    await client.leave(`post_comments:${data.postId}`);
    client.emit('left_post_comments', { 
      message: `Left post ${data.postId} comments`,
      postId: data.postId,
    });
  }

  // =============================================================================
  // REAL-TIME NOTIFICATIONS
  // =============================================================================

  // Notify when a new post is created
  async notifyNewPost(post: any, authorUsername: string) {
    this.server.to('social_feed').emit('new_post', {
      post,
      author: authorUsername,
      timestamp: new Date(),
    });
  }

  // Notify when a post is liked
  async notifyPostLiked(postId: string, likerUsername: string, postAuthorId: string) {
    // Notify the post author
    this.server.to(`user:${postAuthorId}`).emit('post_liked', {
      postId,
      liker: likerUsername,
      timestamp: new Date(),
    });

    // Notify users in the post's comment room
    this.server.to(`post_comments:${postId}`).emit('post_liked', {
      postId,
      liker: likerUsername,
      timestamp: new Date(),
    });
  }

  // Notify when a post is unliked
  async notifyPostUnliked(postId: string, unlikerUsername: string, postAuthorId: string) {
    this.server.to(`user:${postAuthorId}`).emit('post_unliked', {
      postId,
      unliker: unlikerUsername,
      timestamp: new Date(),
    });

    this.server.to(`post_comments:${postId}`).emit('post_unliked', {
      postId,
      unliker: unlikerUsername,
      timestamp: new Date(),
    });
  }

  // Notify when a new comment is added
  async notifyNewComment(comment: any, postId: string, postAuthorId: string) {
    // Notify the post author
    this.server.to(`user:${postAuthorId}`).emit('new_comment', {
      comment,
      postId,
      timestamp: new Date(),
    });

    // Notify users in the post's comment room
    this.server.to(`post_comments:${postId}`).emit('new_comment', {
      comment,
      postId,
      timestamp: new Date(),
    });
  }

  // Notify when a comment is liked
  async notifyCommentLiked(commentId: string, postId: string, likerUsername: string, commentAuthorId: string) {
    // Notify the comment author
    this.server.to(`user:${commentAuthorId}`).emit('comment_liked', {
      commentId,
      postId,
      liker: likerUsername,
      timestamp: new Date(),
    });

    // Notify users in the post's comment room
    this.server.to(`post_comments:${postId}`).emit('comment_liked', {
      commentId,
      postId,
      liker: likerUsername,
      timestamp: new Date(),
    });
  }

  // Notify when a comment is unliked
  async notifyCommentUnliked(commentId: string, postId: string, unlikerUsername: string, commentAuthorId: string) {
    this.server.to(`user:${commentAuthorId}`).emit('comment_unliked', {
      commentId,
      postId,
      unliker: unlikerUsername,
      timestamp: new Date(),
    });

    this.server.to(`post_comments:${postId}`).emit('comment_unliked', {
      commentId,
      postId,
      unliker: unlikerUsername,
      timestamp: new Date(),
    });
  }

  // Notify when someone follows a user
  async notifyNewFollower(followerUsername: string, followedUserId: string) {
    this.server.to(`user:${followedUserId}`).emit('new_follower', {
      follower: followerUsername,
      timestamp: new Date(),
    });
  }

  // Notify when someone unfollows a user
  async notifyUnfollowed(unfollowerUsername: string, unfollowedUserId: string) {
    this.server.to(`user:${unfollowedUserId}`).emit('user_unfollowed', {
      unfollower: unfollowerUsername,
      timestamp: new Date(),
    });
  }

  // Notify when a user's post count changes
  async notifyPostCountChange(userId: string, newCount: number) {
    this.server.to(`user:${userId}`).emit('post_count_changed', {
      newCount,
      timestamp: new Date(),
    });
  }

  // Notify when a user's follower count changes
  async notifyFollowerCountChange(userId: string, newCount: number) {
    this.server.to(`user:${userId}`).emit('follower_count_changed', {
      newCount,
      timestamp: new Date(),
    });
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private extractUserFromToken(token: string): { userId: string; username: string } | null {
    try {
      // In a real implementation, you would verify the JWT token here
      // For now, we'll use a simple approach
      // This should be replaced with proper JWT verification
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return {
        userId: decoded.sub,
        username: decoded.username,
      };
    } catch (error) {
      this.logger.error('Error extracting user from token:', error);
      return null;
    }
  }

  // Get connected user count
  getConnectedUserCount(): number {
    return this.connectedUsers.size;
  }

  // Get connected users
  getConnectedUsers(): Map<string, AuthenticatedSocket> {
    return this.connectedUsers;
  }

  // Check if user is connected
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Send direct message to user
  sendToUser(userId: string, event: string, data: any) {
    const userSocket = this.connectedUsers.get(userId);
    if (userSocket) {
      userSocket.emit(event, data);
    }
  }

  // Broadcast to all connected users
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Broadcast to specific room
  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }
} 