import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
// import { SocialGateway } from './social.gateway';
import { CreatePostDto, PostType } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/comment.dto';
import { UpdateCommentDto } from './dto/comment.dto';
import { UpdateUserProfileDto } from './dto/user-profile.dto';
import { PostResponseDto, PostFeedResponseDto } from './dto/post-response.dto';
import { CommentResponseDto } from './dto/comment.dto';
import { UserProfileResponseDto, UserFollowResponseDto, UserSearchResponseDto } from './dto/user-profile.dto';
import { Logger } from '@nestjs/common';

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    private readonly prisma: PrismaService,
    // @Inject(forwardRef(() => SocialGateway))
    // private readonly socialGateway: SocialGateway,
  ) {}

  // =============================================================================
  // POSTS
  // =============================================================================

  async createPost(userId: string, createPostDto: CreatePostDto): Promise<PostResponseDto> {
    const { hashtags, ...postData } = createPostDto;

    // Create the post
    const post = await this.prisma.post.create({
      data: {
        ...postData,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        match: {
          include: {
            homeTeam: { select: { name: true, logo: true } },
            awayTeam: { select: { name: true, logo: true } },
          },
        },
        prediction: {
          select: {
            id: true,
            predictedScore: true,
            confidence: true,
            homeWinProb: true,
            drawProb: true,
            awayWinProb: true,
          },
        },
      },
    });

    // Process hashtags if provided
    if (hashtags && hashtags.length > 0) {
      await this.processHashtags(post.id, hashtags);
    }

    // Update user's post count
    await this.updateUserPostCount(userId);

    const formattedPost = await this.formatPostResponse(post, userId);

    // Notify via WebSocket (temporarily disabled due to circular dependency)
    // await this.socialGateway.notifyNewPost(formattedPost, post.user.username);

    return formattedPost;
  }

  async getPost(postId: string, userId?: string): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        match: {
          include: {
            homeTeam: { select: { name: true, logo: true } },
            awayTeam: { select: { name: true, logo: true } },
          },
        },
        prediction: {
          select: {
            id: true,
            predictedScore: true,
            confidence: true,
            homeWinProb: true,
            drawProb: true,
            awayWinProb: true,
          },
        },
        hashtags: {
          include: {
            hashtag: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.formatPostResponse(post, userId);
  }

  async updatePost(postId: string, userId: string, updatePostDto: UpdatePostDto): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    const { hashtags, ...updateData } = updatePostDto;

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: {
        ...updateData,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        match: {
          include: {
            homeTeam: { select: { name: true, logo: true } },
            awayTeam: { select: { name: true, logo: true } },
          },
        },
        prediction: {
          select: {
            id: true,
            predictedScore: true,
            confidence: true,
            homeWinProb: true,
            drawProb: true,
            awayWinProb: true,
          },
        },
        hashtags: {
          include: {
            hashtag: true,
          },
        },
      },
    });

    // Update hashtags if provided
    if (hashtags) {
      await this.updatePostHashtags(postId, hashtags);
    }

    return this.formatPostResponse(updatedPost, userId);
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    // Update user's post count
    await this.updateUserPostCount(userId);
  }

  async getFeed(userId: string, page: number = 1, limit: number = 20): Promise<PostFeedResponseDto> {
    const offset = (page - 1) * limit;

    // Get posts from followed users and public posts
    const posts = await this.prisma.post.findMany({
      where: {
        OR: [
          {
            user: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
          },
          {
            isPublic: true,
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        match: {
          include: {
            homeTeam: { select: { name: true, logo: true } },
            awayTeam: { select: { name: true, logo: true } },
          },
        },
        prediction: {
          select: {
            id: true,
            predictedScore: true,
            confidence: true,
            homeWinProb: true,
            drawProb: true,
            awayWinProb: true,
          },
        },
        hashtags: {
          include: {
            hashtag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit + 1, // Take one extra to check if there are more
    });

    const hasMore = posts.length > limit;
    const postsToReturn = hasMore ? posts.slice(0, limit) : posts;

    const formattedPosts = await Promise.all(
      postsToReturn.map(post => this.formatPostResponse(post, userId))
    );

    const totalCount = await this.prisma.post.count({
      where: {
        OR: [
          {
            user: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
          },
          {
            isPublic: true,
          },
        ],
      },
    });

    return {
      posts: formattedPosts,
      totalCount,
      hasMore,
      nextCursor: hasMore ? (page + 1).toString() : undefined,
    };
  }

  async getUserPosts(username: string, userId?: string, page: number = 1, limit: number = 20): Promise<PostFeedResponseDto> {
    const offset = (page - 1) * limit;

    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const posts = await this.prisma.post.findMany({
      where: {
        userId: user.id,
        OR: [
          { isPublic: true },
          { userId: userId }, // User can see their own private posts
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        match: {
          include: {
            homeTeam: { select: { name: true, logo: true } },
            awayTeam: { select: { name: true, logo: true } },
          },
        },
        prediction: {
          select: {
            id: true,
            predictedScore: true,
            confidence: true,
            homeWinProb: true,
            drawProb: true,
            awayWinProb: true,
          },
        },
        hashtags: {
          include: {
            hashtag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit + 1,
    });

    const hasMore = posts.length > limit;
    const postsToReturn = hasMore ? posts.slice(0, limit) : posts;

    const formattedPosts = await Promise.all(
      postsToReturn.map(post => this.formatPostResponse(post, userId))
    );

    const totalCount = await this.prisma.post.count({
      where: {
        userId: user.id,
        OR: [
          { isPublic: true },
          { userId: userId },
        ],
      },
    });

    return {
      posts: formattedPosts,
      totalCount,
      hasMore,
      nextCursor: hasMore ? (page + 1).toString() : undefined,
    };
  }

  // =============================================================================
  // COMMENTS
  // =============================================================================

  async createComment(postId: string, userId: string, createCommentDto: CreateCommentDto): Promise<CommentResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        ...createCommentDto,
        postId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    const formattedComment = await this.formatCommentResponse(comment, userId);

    // Get post author for notification
    const postAuthor = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    });

    if (postAuthor) {
      // Notify via WebSocket (temporarily disabled due to circular dependency)
      // await this.socialGateway.notifyNewComment(formattedComment, postId, postAuthor.userId);
    }

    return formattedComment;
  }

  async updateComment(commentId: string, userId: string, updateCommentDto: UpdateCommentDto): Promise<CommentResponseDto> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        ...updateCommentDto,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return this.formatCommentResponse(updatedComment, userId);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });
  }

  async getPostComments(postId: string, userId?: string, page: number = 1, limit: number = 50): Promise<CommentResponseDto[]> {
    const offset = (page - 1) * limit;

    const comments = await this.prisma.comment.findMany({
      where: {
        postId,
        parentId: null, // Only top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    });

    return Promise.all(comments.map(comment => this.formatCommentResponse(comment, userId)));
  }

  // =============================================================================
  // LIKES
  // =============================================================================

  async likePost(postId: string, userId: string): Promise<void> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      throw new BadRequestException('Post already liked');
    }

    await this.prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    // Get user and post info for notification
    const [user, postInfo] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      }),
      this.prisma.post.findUnique({
        where: { id: postId },
        select: { userId: true },
      }),
    ]);

    if (user && postInfo) {
      // Notify via WebSocket (temporarily disabled due to circular dependency)
      // await this.socialGateway.notifyPostLiked(postId, user.username, postInfo.userId);
    }
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    const like = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!like) {
      throw new NotFoundException('Like not found');
    }

    // Get user and post info for notification
    const [user, postInfo] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      }),
      this.prisma.post.findUnique({
        where: { id: postId },
        select: { userId: true },
      }),
    ]);

    await this.prisma.like.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (user && postInfo) {
      // Notify via WebSocket (temporarily disabled due to circular dependency)
      // await this.socialGateway.notifyPostUnliked(postId, user.username, postInfo.userId);
    }
  }

  async likeComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (existingLike) {
      throw new BadRequestException('Comment already liked');
    }

    await this.prisma.like.create({
      data: {
        userId,
        commentId,
      },
    });
  }

  async unlikeComment(commentId: string, userId: string): Promise<void> {
    const like = await this.prisma.like.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (!like) {
      throw new NotFoundException('Like not found');
    }

    await this.prisma.like.delete({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });
  }

  // =============================================================================
  // USER PROFILES
  // =============================================================================

  async getUserProfile(username: string, currentUserId?: string): Promise<UserProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        userProfile: true,
        userStats: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isFollowedByCurrentUser = currentUserId
      ? await this.isUserFollowed(user.id, currentUserId)
      : false;

    return {
      id: user.userProfile?.id || '',
      userId: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      bio: user.userProfile?.bio,
      location: user.userProfile?.location,
      website: user.userProfile?.website,
      socialLinks: user.userProfile?.socialLinks as any,
      favoriteTeam: user.userProfile?.favoriteTeam,
      favoritePlayer: user.userProfile?.favoritePlayer,
      predictionAccuracy: user.userStats?.accuracy || 0,
      totalPredictions: user.userStats?.totalPredictions || 0,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      postsCount: user._count.posts,
      achievements: user.userProfile?.achievements || [],
      badges: user.userProfile?.badges || [],
      isVerified: user.userProfile?.isVerified || false,
      isFollowedByCurrentUser,
      createdAt: user.userProfile?.createdAt || user.createdAt,
      updatedAt: user.userProfile?.updatedAt || user.updatedAt,
    };
  }

  async updateUserProfile(userId: string, updateUserProfileDto: UpdateUserProfileDto): Promise<UserProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userProfile: true,
        userStats: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let userProfile = user.userProfile;

    if (!userProfile) {
      // Create user profile if it doesn't exist
      userProfile = await this.prisma.userProfile.create({
        data: {
          userId,
          ...updateUserProfileDto,
        },
      });
    } else {
      // Update existing profile
      userProfile = await this.prisma.userProfile.update({
        where: { id: userProfile.id },
        data: updateUserProfileDto,
      });
    }

    return {
      id: userProfile.id,
      userId: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      bio: userProfile.bio,
      location: userProfile.location,
      website: userProfile.website,
      socialLinks: userProfile.socialLinks as any,
      favoriteTeam: userProfile.favoriteTeam,
      favoritePlayer: userProfile.favoritePlayer,
      predictionAccuracy: user.userStats?.accuracy || 0,
      totalPredictions: user.userStats?.totalPredictions || 0,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      postsCount: user._count.posts,
      achievements: userProfile.achievements,
      badges: userProfile.badges,
      isVerified: userProfile.isVerified,
      isFollowedByCurrentUser: false, // User can't follow themselves
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt,
    };
  }

  // =============================================================================
  // FOLLOW SYSTEM
  // =============================================================================

  async followUser(followerId: string, followingUsername: string): Promise<UserFollowResponseDto> {
    const following = await this.prisma.user.findUnique({
      where: { username: followingUsername },
    });

    if (!following) {
      throw new NotFoundException('User to follow not found');
    }

    if (followerId === following.id) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const existingFollow = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: following.id,
        },
      },
    });

    if (existingFollow) {
      throw new BadRequestException('Already following this user');
    }

    const follow = await this.prisma.userFollow.create({
      data: {
        followerId,
        followingId: following.id,
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        following: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Notify via WebSocket (temporarily disabled due to circular dependency)
    // await this.socialGateway.notifyNewFollower(follow.follower.username, following.id);

    return {
      id: follow.id,
      followerId: follow.followerId,
      followingId: follow.followingId,
      follower: {
        id: follow.follower.id,
        username: follow.follower.username,
        avatar: follow.follower.avatar,
      },
      following: {
        id: follow.following.id,
        username: follow.following.username,
        avatar: follow.following.avatar,
      },
      createdAt: follow.createdAt,
    };
  }

  async unfollowUser(followerId: string, followingUsername: string): Promise<void> {
    const following = await this.prisma.user.findUnique({
      where: { username: followingUsername },
    });

    if (!following) {
      throw new NotFoundException('User to unfollow not found');
    }

    const follow = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: following.id,
        },
      },
    });

    if (!follow) {
      throw new NotFoundException('Follow relationship not found');
    }

    // Get follower info for notification
    const follower = await this.prisma.user.findUnique({
      where: { id: followerId },
      select: { username: true },
    });

    await this.prisma.userFollow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: following.id,
        },
      },
    });

    if (follower) {
      // Notify via WebSocket (temporarily disabled due to circular dependency)
      // await this.socialGateway.notifyUnfollowed(follower.username, following.id);
    }
  }

  async getFollowers(username: string, page: number = 1, limit: number = 20): Promise<UserSearchResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const offset = (page - 1) * limit;

    const followers = await this.prisma.userFollow.findMany({
      where: {
        followingId: user.id,
      },
      include: {
        follower: {
          include: {
            userProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit + 1,
    });

    const hasMore = followers.length > limit;
    const followersToReturn = hasMore ? followers.slice(0, limit) : followers;

    const users = followersToReturn.map(follow => ({
      id: follow.follower.userProfile?.id || '',
      userId: follow.follower.id,
      username: follow.follower.username,
      firstName: follow.follower.firstName,
      lastName: follow.follower.lastName,
      avatar: follow.follower.avatar,
      bio: follow.follower.userProfile?.bio,
      location: follow.follower.userProfile?.location,
      website: follow.follower.userProfile?.website,
      socialLinks: follow.follower.userProfile?.socialLinks as any,
      favoriteTeam: follow.follower.userProfile?.favoriteTeam,
      favoritePlayer: follow.follower.userProfile?.favoritePlayer,
      predictionAccuracy: 0, // Would need to join with userStats
      totalPredictions: 0,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      achievements: follow.follower.userProfile?.achievements || [],
      badges: follow.follower.userProfile?.badges || [],
      isVerified: follow.follower.userProfile?.isVerified || false,
      isFollowedByCurrentUser: false, // Would need current user context
      createdAt: follow.follower.userProfile?.createdAt || follow.follower.createdAt,
      updatedAt: follow.follower.userProfile?.updatedAt || follow.follower.updatedAt,
    }));

    const totalCount = await this.prisma.userFollow.count({
      where: {
        followingId: user.id,
      },
    });

    return {
      users,
      totalCount,
      hasMore,
    };
  }

  async getFollowing(username: string, page: number = 1, limit: number = 20): Promise<UserSearchResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const offset = (page - 1) * limit;

    const following = await this.prisma.userFollow.findMany({
      where: {
        followerId: user.id,
      },
      include: {
        following: {
          include: {
            userProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit + 1,
    });

    const hasMore = following.length > limit;
    const followingToReturn = hasMore ? following.slice(0, limit) : following;

    const users = followingToReturn.map(follow => ({
      id: follow.following.userProfile?.id || '',
      userId: follow.following.id,
      username: follow.following.username,
      firstName: follow.following.firstName,
      lastName: follow.following.lastName,
      avatar: follow.following.avatar,
      bio: follow.following.userProfile?.bio,
      location: follow.following.userProfile?.location,
      website: follow.following.userProfile?.website,
      socialLinks: follow.following.userProfile?.socialLinks as any,
      favoriteTeam: follow.following.userProfile?.favoriteTeam,
      favoritePlayer: follow.following.userProfile?.favoritePlayer,
      predictionAccuracy: 0,
      totalPredictions: 0,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      achievements: follow.following.userProfile?.achievements || [],
      badges: follow.following.userProfile?.badges || [],
      isVerified: follow.following.userProfile?.isVerified || false,
      isFollowedByCurrentUser: false,
      createdAt: follow.following.userProfile?.createdAt || follow.following.createdAt,
      updatedAt: follow.following.userProfile?.updatedAt || follow.following.updatedAt,
    }));

    const totalCount = await this.prisma.userFollow.count({
      where: {
        followerId: user.id,
      },
    });

    return {
      users,
      totalCount,
      hasMore,
    };
  }

  // =============================================================================
  // SEARCH
  // =============================================================================

  async searchUsers(query: string, currentUserId?: string, page: number = 1, limit: number = 20): Promise<UserSearchResponseDto> {
    const offset = (page - 1) * limit;

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        userProfile: true,
        userStats: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
      orderBy: {
        username: 'asc',
      },
      skip: offset,
      take: limit + 1,
    });

    const hasMore = users.length > limit;
    const usersToReturn = hasMore ? users.slice(0, limit) : users;

    const formattedUsers = await Promise.all(
      usersToReturn.map(async user => ({
        id: user.userProfile?.id || '',
        userId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        bio: user.userProfile?.bio,
        location: user.userProfile?.location,
        website: user.userProfile?.website,
        socialLinks: user.userProfile?.socialLinks as any,
        favoriteTeam: user.userProfile?.favoriteTeam,
        favoritePlayer: user.userProfile?.favoritePlayer,
        predictionAccuracy: user.userStats?.accuracy || 0,
        totalPredictions: user.userStats?.totalPredictions || 0,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        postsCount: user._count.posts,
        achievements: user.userProfile?.achievements || [],
        badges: user.userProfile?.badges || [],
        isVerified: user.userProfile?.isVerified || false,
        isFollowedByCurrentUser: currentUserId ? await this.isUserFollowed(user.id, currentUserId) : false,
        createdAt: user.userProfile?.createdAt || user.createdAt,
        updatedAt: user.userProfile?.updatedAt || user.updatedAt,
      }))
    );

    const totalCount = await this.prisma.user.count({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    return {
      users: formattedUsers,
      totalCount,
      hasMore,
    };
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private async formatPostResponse(post: any, userId?: string): Promise<PostResponseDto> {
    const likesCount = await this.prisma.like.count({
      where: { postId: post.id },
    });

    const commentsCount = await this.prisma.comment.count({
      where: { postId: post.id },
    });

    const isLikedByCurrentUser = userId
      ? await this.prisma.like.findUnique({
          where: {
            userId_postId: {
              userId,
              postId: post.id,
            },
          },
        }) !== null
      : false;

    const hashtags = post.hashtags?.map((ph: any) => ph.hashtag.name) || [];

    return {
      id: post.id,
      content: post.content,
      type: post.type,
      matchId: post.matchId,
      predictionId: post.predictionId,
      imageUrl: post.imageUrl,
      isPublic: post.isPublic,
      isEdited: post.isEdited,
      editedAt: post.editedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: {
        id: post.user.id,
        username: post.user.username,
        firstName: post.user.firstName,
        lastName: post.user.lastName,
        avatar: post.user.avatar,
        isVerified: false, // Would need to check user profile
      },
      likesCount,
      commentsCount,
      isLikedByCurrentUser,
      hashtags,
      match: post.match ? {
        id: post.match.id,
        homeTeam: post.match.homeTeam,
        awayTeam: post.match.awayTeam,
        matchDate: post.match.matchDate,
        status: post.match.status,
      } : undefined,
      prediction: post.prediction ? {
        id: post.prediction.id,
        predictedScore: post.prediction.predictedScore,
        confidence: post.prediction.confidence,
        homeWinProb: post.prediction.homeWinProb,
        drawProb: post.prediction.drawProb,
        awayWinProb: post.prediction.awayWinProb,
      } : undefined,
    };
  }

  private async formatCommentResponse(comment: any, userId?: string): Promise<CommentResponseDto> {
    const likesCount = await this.prisma.like.count({
      where: { commentId: comment.id },
    });

    const repliesCount = await this.prisma.comment.count({
      where: { parentId: comment.id },
    });

    const isLikedByCurrentUser = userId
      ? await this.prisma.like.findUnique({
          where: {
            userId_commentId: {
              userId,
              commentId: comment.id,
            },
          },
        }) !== null
      : false;

    const replies = await Promise.all(
      comment.replies.map((reply: any) => this.formatCommentResponse(reply, userId))
    );

    return {
      id: comment.id,
      content: comment.content,
      postId: comment.postId,
      userId: comment.userId,
      username: comment.user.username,
      userAvatar: comment.user.avatar,
      parentId: comment.parentId,
      isEdited: comment.isEdited,
      editedAt: comment.editedAt,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      likesCount,
      isLikedByCurrentUser,
      replies,
      repliesCount,
    };
  }

  private async processHashtags(postId: string, hashtags: string[]): Promise<void> {
    for (const hashtagName of hashtags) {
      const cleanName = hashtagName.replace('#', '').toLowerCase();
      
      // Find or create hashtag
      let hashtag = await this.prisma.hashtag.findUnique({
        where: { name: cleanName },
      });

      if (!hashtag) {
        hashtag = await this.prisma.hashtag.create({
          data: {
            name: cleanName,
            description: `Posts tagged with #${cleanName}`,
          },
        });
      }

      // Create post-hashtag relationship
      await this.prisma.postHashtag.create({
        data: {
          postId,
          hashtagId: hashtag.id,
        },
      });

      // Update hashtag post count
      await this.prisma.hashtag.update({
        where: { id: hashtag.id },
        data: {
          postsCount: {
            increment: 1,
          },
        },
      });
    }
  }

  private async updatePostHashtags(postId: string, hashtags: string[]): Promise<void> {
    // Remove existing hashtags
    await this.prisma.postHashtag.deleteMany({
      where: { postId },
    });

    // Add new hashtags
    await this.processHashtags(postId, hashtags);
  }

  private async updateUserPostCount(userId: string): Promise<void> {
    const postCount = await this.prisma.post.count({
      where: { userId },
    });

    await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        postsCount: postCount,
      },
      create: {
        userId,
        postsCount: postCount,
      },
    });
  }

  private async isUserFollowed(followingId: string, followerId: string): Promise<boolean> {
    const follow = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return follow !== null;
  }
} 