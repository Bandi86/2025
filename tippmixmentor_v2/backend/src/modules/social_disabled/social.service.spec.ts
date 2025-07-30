import { Test, TestingModule } from '@nestjs/testing';
import { SocialService } from './social.service';
import { SocialGateway } from './social.gateway';
import { PrismaService } from '../../common/database/prisma.service';
import { CreatePostDto, PostType } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/comment.dto';
import { UpdateUserProfileDto } from './dto/user-profile.dto';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('SocialService', () => {
  let service: SocialService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    post: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    like: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    userFollow: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    userProfile: {
      upsert: jest.fn(),
    },
    hashtag: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    postHashtag: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockSocialGateway = {
    notifyNewPost: jest.fn(),
    notifyNewComment: jest.fn(),
    notifyPostLiked: jest.fn(),
    notifyPostUnliked: jest.fn(),
    notifyNewFollower: jest.fn(),
    notifyUnfollowed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SocialGateway,
          useValue: mockSocialGateway,
        },
      ],
    }).compile();

    service = module.get<SocialService>(SocialService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    const mockUserId = 'user-123';
    const mockCreatePostDto: CreatePostDto = {
      content: 'Test post content',
      type: PostType.GENERAL,
      hashtags: ['#test', '#football'],
    };

    const mockPost = {
      id: 'post-123',
      content: 'Test post content',
      type: PostType.GENERAL,
      userId: mockUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: mockUserId,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
      },
      match: null,
      prediction: null,
      hashtags: [],
    };

    it('should create a post successfully', async () => {
      mockPrismaService.post.create.mockResolvedValue(mockPost);
      mockPrismaService.userProfile.upsert.mockResolvedValue({});
      // Mock hashtag processing
      mockPrismaService.hashtag.findUnique.mockResolvedValue(null);
      mockPrismaService.hashtag.create.mockResolvedValue({ id: 'hashtag-1', name: 'test' });
      mockPrismaService.postHashtag.create.mockResolvedValue({});

      const result = await service.createPost(mockUserId, mockCreatePostDto);

      expect(mockPrismaService.post.create).toHaveBeenCalledWith({
        data: {
          content: mockCreatePostDto.content,
          type: mockCreatePostDto.type,
          userId: mockUserId,
        },
        include: expect.any(Object),
      });
      expect(result).toBeDefined();
    });

    it('should process hashtags when provided', async () => {
      mockPrismaService.post.create.mockResolvedValue(mockPost);
      mockPrismaService.userProfile.upsert.mockResolvedValue({});
      mockPrismaService.hashtag.findUnique.mockResolvedValue(null);
      mockPrismaService.hashtag.create.mockResolvedValue({ id: 'hashtag-1', name: 'test' });
      mockPrismaService.postHashtag.create.mockResolvedValue({});

      await service.createPost(mockUserId, mockCreatePostDto);

      expect(mockPrismaService.hashtag.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.hashtag.create).toHaveBeenCalled();
      expect(mockPrismaService.postHashtag.create).toHaveBeenCalled();
    });
  });

  describe('getPost', () => {
    const mockPostId = 'post-123';
    const mockUserId = 'user-123';

    it('should return a post when found', async () => {
      const mockPost = {
        id: mockPostId,
        content: 'Test post',
        user: { id: 'user-123', username: 'testuser' },
        hashtags: [],
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.like.count.mockResolvedValue(5);
      mockPrismaService.comment.count.mockResolvedValue(3);
      mockPrismaService.like.findUnique.mockResolvedValue(null);

      const result = await service.getPost(mockPostId, mockUserId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockPostId);
    });

    it('should throw NotFoundException when post not found', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.getPost(mockPostId, mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePost', () => {
    const mockPostId = 'post-123';
    const mockUserId = 'user-123';
    const mockUpdatePostDto = { content: 'Updated content' };

    it('should update a post successfully', async () => {
      const mockPost = {
        id: mockPostId,
        userId: mockUserId,
        content: 'Original content',
      };

      const mockUpdatedPost = {
        ...mockPost,
        content: 'Updated content',
        isEdited: true,
        editedAt: new Date(),
        user: { id: mockUserId, username: 'testuser' },
        hashtags: [],
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.post.update.mockResolvedValue(mockUpdatedPost);
      mockPrismaService.like.count.mockResolvedValue(5);
      mockPrismaService.comment.count.mockResolvedValue(3);
      mockPrismaService.like.findUnique.mockResolvedValue(null);

      const result = await service.updatePost(mockPostId, mockUserId, mockUpdatePostDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.post.update).toHaveBeenCalledWith({
        where: { id: mockPostId },
        data: {
          ...mockUpdatePostDto,
          isEdited: true,
          editedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should throw ForbiddenException when user is not the post owner', async () => {
      const mockPost = {
        id: mockPostId,
        userId: 'different-user',
        content: 'Original content',
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      await expect(service.updatePost(mockPostId, mockUserId, mockUpdatePostDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deletePost', () => {
    const mockPostId = 'post-123';
    const mockUserId = 'user-123';

    it('should delete a post successfully', async () => {
      const mockPost = {
        id: mockPostId,
        userId: mockUserId,
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.post.delete.mockResolvedValue({});
      mockPrismaService.post.count.mockResolvedValue(0);
      mockPrismaService.userProfile.upsert.mockResolvedValue({});

      await service.deletePost(mockPostId, mockUserId);

      expect(mockPrismaService.post.delete).toHaveBeenCalledWith({
        where: { id: mockPostId },
      });
    });

    it('should throw ForbiddenException when user is not the post owner', async () => {
      const mockPost = {
        id: mockPostId,
        userId: 'different-user',
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      await expect(service.deletePost(mockPostId, mockUserId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createComment', () => {
    const mockPostId = 'post-123';
    const mockUserId = 'user-123';
    const mockCreateCommentDto: CreateCommentDto = {
      content: 'Test comment',
    };

    it('should create a comment successfully', async () => {
      const mockPost = { id: mockPostId };
      const mockComment = {
        id: 'comment-123',
        content: 'Test comment',
        postId: mockPostId,
        userId: mockUserId,
        user: { id: mockUserId, username: 'testuser', avatar: null },
        replies: [],
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.comment.create.mockResolvedValue(mockComment);
      mockPrismaService.like.count.mockResolvedValue(0);
      mockPrismaService.comment.count.mockResolvedValue(0);
      mockPrismaService.like.findUnique.mockResolvedValue(null);

      const result = await service.createComment(mockPostId, mockUserId, mockCreateCommentDto);

      expect(result).toBeDefined();
      expect(result.content).toBe('Test comment');
    });

    it('should throw NotFoundException when post not found', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.createComment(mockPostId, mockUserId, mockCreateCommentDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('likePost', () => {
    const mockPostId = 'post-123';
    const mockUserId = 'user-123';

    it('should like a post successfully', async () => {
      const mockPost = { id: mockPostId };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.like.findUnique.mockResolvedValue(null);
      mockPrismaService.like.create.mockResolvedValue({});

      await service.likePost(mockPostId, mockUserId);

      expect(mockPrismaService.like.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          postId: mockPostId,
        },
      });
    });

    it('should throw BadRequestException when post already liked', async () => {
      const mockPost = { id: mockPostId };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.like.findUnique.mockResolvedValue({ id: 'like-123' });

      await expect(service.likePost(mockPostId, mockUserId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserProfile', () => {
    const mockUsername = 'testuser';
    const mockCurrentUserId = 'user-123';

    it('should return user profile successfully', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
        userProfile: {
          id: 'profile-123',
          bio: 'Test bio',
          location: 'Test City',
        },
        userStats: {
          accuracy: 0.85,
          totalPredictions: 100,
        },
        _count: {
          posts: 10,
          followers: 50,
          following: 30,
        },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.userFollow.findUnique.mockResolvedValue(null);

      const result = await service.getUserProfile(mockUsername, mockCurrentUserId);

      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
      expect(result.predictionAccuracy).toBe(0.85);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserProfile(mockUsername, mockCurrentUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('followUser', () => {
    const mockFollowerId = 'user-123';
    const mockFollowingUsername = 'testuser';

    it('should follow a user successfully', async () => {
      const mockFollowing = { id: 'user-456', username: 'testuser' };
      const mockFollow = {
        id: 'follow-123',
        followerId: mockFollowerId,
        followingId: 'user-456',
        follower: { id: mockFollowerId, username: 'follower', avatar: null },
        following: { id: 'user-456', username: 'testuser', avatar: null },
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockFollowing);
      mockPrismaService.userFollow.findUnique.mockResolvedValue(null);
      mockPrismaService.userFollow.create.mockResolvedValue(mockFollow);

      const result = await service.followUser(mockFollowerId, mockFollowingUsername);

      expect(result).toBeDefined();
      expect(result.following.username).toBe('testuser');
    });

    it('should throw BadRequestException when trying to follow yourself', async () => {
      const mockFollowing = { id: mockFollowerId, username: 'testuser' };

      mockPrismaService.user.findUnique.mockResolvedValue(mockFollowing);

      await expect(service.followUser(mockFollowerId, mockFollowingUsername)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when already following', async () => {
      const mockFollowing = { id: 'user-456', username: 'testuser' };

      mockPrismaService.user.findUnique.mockResolvedValue(mockFollowing);
      mockPrismaService.userFollow.findUnique.mockResolvedValue({ id: 'follow-123' });

      await expect(service.followUser(mockFollowerId, mockFollowingUsername)).rejects.toThrow(BadRequestException);
    });
  });

  describe('searchUsers', () => {
    const mockQuery = 'test';
    const mockCurrentUserId = 'user-123';

    it('should search users successfully', async () => {
      const mockUsers = [
        {
          id: 'user-123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          avatar: null,
          userProfile: null,
          userStats: null,
          _count: { posts: 0, followers: 0, following: 0 },
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.user.count.mockResolvedValue(1);
      mockPrismaService.userFollow.findUnique.mockResolvedValue(null);

      const result = await service.searchUsers(mockQuery, mockCurrentUserId);

      expect(result).toBeDefined();
      expect(result.users).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });
  });
}); 