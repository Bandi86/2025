import { Test, TestingModule } from '@nestjs/testing';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { CreatePostDto, PostType } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/comment.dto';
import { UpdateUserProfileDto } from './dto/user-profile.dto';
import { PostResponseDto, PostFeedResponseDto } from './dto/post-response.dto';
import { CommentResponseDto } from './dto/comment.dto';
import { UserProfileResponseDto, UserFollowResponseDto, UserSearchResponseDto } from './dto/user-profile.dto';

describe('SocialController', () => {
  let controller: SocialController;
  let service: SocialService;

  const mockSocialService = {
    createPost: jest.fn(),
    getPost: jest.fn(),
    updatePost: jest.fn(),
    deletePost: jest.fn(),
    getFeed: jest.fn(),
    getUserPosts: jest.fn(),
    createComment: jest.fn(),
    updateComment: jest.fn(),
    deleteComment: jest.fn(),
    getPostComments: jest.fn(),
    likePost: jest.fn(),
    unlikePost: jest.fn(),
    likeComment: jest.fn(),
    unlikeComment: jest.fn(),
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    followUser: jest.fn(),
    unfollowUser: jest.fn(),
    getFollowers: jest.fn(),
    getFollowing: jest.fn(),
    searchUsers: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocialController],
      providers: [
        {
          provide: SocialService,
          useValue: mockSocialService,
        },
      ],
    }).compile();

    controller = module.get<SocialController>(SocialController);
    service = module.get<SocialService>(SocialService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    const mockCreatePostDto: CreatePostDto = {
      content: 'Test post content',
      type: PostType.GENERAL,
      hashtags: ['#test', '#football'],
    };

    const mockPostResponse: PostResponseDto = {
      id: 'post-123',
      content: 'Test post content',
      type: PostType.GENERAL,
      isPublic: true,
      isEdited: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 'user-123',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
        isVerified: false,
      },
      likesCount: 0,
      commentsCount: 0,
      isLikedByCurrentUser: false,
      hashtags: ['test', 'football'],
    };

    it('should create a post successfully', async () => {
      mockSocialService.createPost.mockResolvedValue(mockPostResponse);

      const result = await controller.createPost({ user: mockUser }, mockCreatePostDto);

      expect(service.createPost).toHaveBeenCalledWith(mockUser.id, mockCreatePostDto);
      expect(result).toEqual(mockPostResponse);
    });
  });

  describe('getPost', () => {
    const mockPostId = 'post-123';

    it('should return a post successfully', async () => {
      const mockPostResponse: PostResponseDto = {
        id: mockPostId,
        content: 'Test post',
        type: PostType.GENERAL,
        isPublic: true,
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          avatar: null,
          isVerified: false,
        },
        likesCount: 5,
        commentsCount: 3,
        isLikedByCurrentUser: true,
        hashtags: [],
      };

      mockSocialService.getPost.mockResolvedValue(mockPostResponse);

      const result = await controller.getPost(mockPostId, { user: mockUser });

      expect(service.getPost).toHaveBeenCalledWith(mockPostId, mockUser.id);
      expect(result).toEqual(mockPostResponse);
    });
  });

  describe('updatePost', () => {
    const mockPostId = 'post-123';
    const mockUpdatePostDto = { content: 'Updated content' };

    it('should update a post successfully', async () => {
      const mockPostResponse: PostResponseDto = {
        id: mockPostId,
        content: 'Updated content',
        type: PostType.GENERAL,
        isPublic: true,
        isEdited: true,
        editedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          avatar: null,
          isVerified: false,
        },
        likesCount: 5,
        commentsCount: 3,
        isLikedByCurrentUser: true,
        hashtags: [],
      };

      mockSocialService.updatePost.mockResolvedValue(mockPostResponse);

      const result = await controller.updatePost(mockPostId, { user: mockUser }, mockUpdatePostDto);

      expect(service.updatePost).toHaveBeenCalledWith(mockPostId, mockUser.id, mockUpdatePostDto);
      expect(result).toEqual(mockPostResponse);
    });
  });

  describe('deletePost', () => {
    const mockPostId = 'post-123';

    it('should delete a post successfully', async () => {
      mockSocialService.deletePost.mockResolvedValue(undefined);

      await controller.deletePost(mockPostId, { user: mockUser });

      expect(service.deletePost).toHaveBeenCalledWith(mockPostId, mockUser.id);
    });
  });

  describe('getFeed', () => {
    it('should return user feed successfully', async () => {
      const mockFeedResponse: PostFeedResponseDto = {
        posts: [],
        totalCount: 0,
        hasMore: false,
      };

      mockSocialService.getFeed.mockResolvedValue(mockFeedResponse);

      const result = await controller.getFeed({ user: mockUser }, 1, 20);

      expect(service.getFeed).toHaveBeenCalledWith(mockUser.id, 1, 20);
      expect(result).toEqual(mockFeedResponse);
    });
  });

  describe('getUserPosts', () => {
    const mockUsername = 'testuser';

    it('should return user posts successfully', async () => {
      const mockPostsResponse: PostFeedResponseDto = {
        posts: [],
        totalCount: 0,
        hasMore: false,
      };

      mockSocialService.getUserPosts.mockResolvedValue(mockPostsResponse);

      const result = await controller.getUserPosts(mockUsername, { user: mockUser }, 1, 20);

      expect(service.getUserPosts).toHaveBeenCalledWith(mockUsername, mockUser.id, 1, 20);
      expect(result).toEqual(mockPostsResponse);
    });
  });

  describe('createComment', () => {
    const mockPostId = 'post-123';
    const mockCreateCommentDto: CreateCommentDto = {
      content: 'Test comment',
    };

    it('should create a comment successfully', async () => {
      const mockCommentResponse: CommentResponseDto = {
        id: 'comment-123',
        content: 'Test comment',
        postId: mockPostId,
        userId: 'user-123',
        username: 'testuser',
        userAvatar: null,
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        likesCount: 0,
        isLikedByCurrentUser: false,
        replies: [],
        repliesCount: 0,
      };

      mockSocialService.createComment.mockResolvedValue(mockCommentResponse);

      const result = await controller.createComment(mockPostId, { user: mockUser }, mockCreateCommentDto);

      expect(service.createComment).toHaveBeenCalledWith(mockPostId, mockUser.id, mockCreateCommentDto);
      expect(result).toEqual(mockCommentResponse);
    });
  });

  describe('updateComment', () => {
    const mockCommentId = 'comment-123';
    const mockUpdateCommentDto = { content: 'Updated comment' };

    it('should update a comment successfully', async () => {
      const mockCommentResponse: CommentResponseDto = {
        id: mockCommentId,
        content: 'Updated comment',
        postId: 'post-123',
        userId: 'user-123',
        username: 'testuser',
        userAvatar: null,
        isEdited: true,
        editedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        likesCount: 0,
        isLikedByCurrentUser: false,
        replies: [],
        repliesCount: 0,
      };

      mockSocialService.updateComment.mockResolvedValue(mockCommentResponse);

      const result = await controller.updateComment(mockCommentId, { user: mockUser }, mockUpdateCommentDto);

      expect(service.updateComment).toHaveBeenCalledWith(mockCommentId, mockUser.id, mockUpdateCommentDto);
      expect(result).toEqual(mockCommentResponse);
    });
  });

  describe('deleteComment', () => {
    const mockCommentId = 'comment-123';

    it('should delete a comment successfully', async () => {
      mockSocialService.deleteComment.mockResolvedValue(undefined);

      await controller.deleteComment(mockCommentId, { user: mockUser });

      expect(service.deleteComment).toHaveBeenCalledWith(mockCommentId, mockUser.id);
    });
  });

  describe('getPostComments', () => {
    const mockPostId = 'post-123';

    it('should return post comments successfully', async () => {
      const mockComments: CommentResponseDto[] = [];

      mockSocialService.getPostComments.mockResolvedValue(mockComments);

      const result = await controller.getPostComments(mockPostId, { user: mockUser }, 1, 50);

      expect(service.getPostComments).toHaveBeenCalledWith(mockPostId, mockUser.id, 1, 50);
      expect(result).toEqual(mockComments);
    });
  });

  describe('likePost', () => {
    const mockPostId = 'post-123';

    it('should like a post successfully', async () => {
      mockSocialService.likePost.mockResolvedValue(undefined);

      await controller.likePost(mockPostId, { user: mockUser });

      expect(service.likePost).toHaveBeenCalledWith(mockPostId, mockUser.id);
    });
  });

  describe('unlikePost', () => {
    const mockPostId = 'post-123';

    it('should unlike a post successfully', async () => {
      mockSocialService.unlikePost.mockResolvedValue(undefined);

      await controller.unlikePost(mockPostId, { user: mockUser });

      expect(service.unlikePost).toHaveBeenCalledWith(mockPostId, mockUser.id);
    });
  });

  describe('likeComment', () => {
    const mockCommentId = 'comment-123';

    it('should like a comment successfully', async () => {
      mockSocialService.likeComment.mockResolvedValue(undefined);

      await controller.likeComment(mockCommentId, { user: mockUser });

      expect(service.likeComment).toHaveBeenCalledWith(mockCommentId, mockUser.id);
    });
  });

  describe('unlikeComment', () => {
    const mockCommentId = 'comment-123';

    it('should unlike a comment successfully', async () => {
      mockSocialService.unlikeComment.mockResolvedValue(undefined);

      await controller.unlikeComment(mockCommentId, { user: mockUser });

      expect(service.unlikeComment).toHaveBeenCalledWith(mockCommentId, mockUser.id);
    });
  });

  describe('getUserProfile', () => {
    const mockUsername = 'testuser';

    it('should return user profile successfully', async () => {
      const mockProfileResponse: UserProfileResponseDto = {
        id: 'profile-123',
        userId: 'user-123',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
        bio: 'Test bio',
        location: 'Test City',
        website: null,
        socialLinks: {},
        favoriteTeam: null,
        favoritePlayer: null,
        predictionAccuracy: 0.85,
        totalPredictions: 100,
        followersCount: 50,
        followingCount: 30,
        postsCount: 10,
        achievements: [],
        badges: [],
        isVerified: false,
        isFollowedByCurrentUser: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSocialService.getUserProfile.mockResolvedValue(mockProfileResponse);

      const result = await controller.getUserProfile(mockUsername, { user: mockUser });

      expect(service.getUserProfile).toHaveBeenCalledWith(mockUsername, mockUser.id);
      expect(result).toEqual(mockProfileResponse);
    });
  });

  describe('updateUserProfile', () => {
    const mockUpdateProfileDto: UpdateUserProfileDto = {
      bio: 'Updated bio',
      location: 'Updated City',
    };

    it('should update user profile successfully', async () => {
      const mockProfileResponse: UserProfileResponseDto = {
        id: 'profile-123',
        userId: 'user-123',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
        bio: 'Updated bio',
        location: 'Updated City',
        website: null,
        socialLinks: {},
        favoriteTeam: null,
        favoritePlayer: null,
        predictionAccuracy: 0.85,
        totalPredictions: 100,
        followersCount: 50,
        followingCount: 30,
        postsCount: 10,
        achievements: [],
        badges: [],
        isVerified: false,
        isFollowedByCurrentUser: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSocialService.updateUserProfile.mockResolvedValue(mockProfileResponse);

      const result = await controller.updateUserProfile({ user: mockUser }, mockUpdateProfileDto);

      expect(service.updateUserProfile).toHaveBeenCalledWith(mockUser.id, mockUpdateProfileDto);
      expect(result).toEqual(mockProfileResponse);
    });
  });

  describe('followUser', () => {
    const mockUsername = 'user-to-follow';

    it('should follow a user successfully', async () => {
      const mockFollowResponse: UserFollowResponseDto = {
        id: 'follow-123',
        followerId: 'user-123',
        followingId: 'user-456',
        follower: {
          id: 'user-123',
          username: 'testuser',
          avatar: null,
        },
        following: {
          id: 'user-456',
          username: 'user-to-follow',
          avatar: null,
        },
        createdAt: new Date(),
      };

      mockSocialService.followUser.mockResolvedValue(mockFollowResponse);

      const result = await controller.followUser(mockUsername, { user: mockUser });

      expect(service.followUser).toHaveBeenCalledWith(mockUser.id, mockUsername);
      expect(result).toEqual(mockFollowResponse);
    });
  });

  describe('unfollowUser', () => {
    const mockUsername = 'user-to-unfollow';

    it('should unfollow a user successfully', async () => {
      mockSocialService.unfollowUser.mockResolvedValue(undefined);

      await controller.unfollowUser(mockUsername, { user: mockUser });

      expect(service.unfollowUser).toHaveBeenCalledWith(mockUser.id, mockUsername);
    });
  });

  describe('getFollowers', () => {
    const mockUsername = 'testuser';

    it('should return user followers successfully', async () => {
      const mockFollowersResponse: UserSearchResponseDto = {
        users: [],
        totalCount: 0,
        hasMore: false,
      };

      mockSocialService.getFollowers.mockResolvedValue(mockFollowersResponse);

      const result = await controller.getFollowers(mockUsername, 1, 20);

      expect(service.getFollowers).toHaveBeenCalledWith(mockUsername, 1, 20);
      expect(result).toEqual(mockFollowersResponse);
    });
  });

  describe('getFollowing', () => {
    const mockUsername = 'testuser';

    it('should return following users successfully', async () => {
      const mockFollowingResponse: UserSearchResponseDto = {
        users: [],
        totalCount: 0,
        hasMore: false,
      };

      mockSocialService.getFollowing.mockResolvedValue(mockFollowingResponse);

      const result = await controller.getFollowing(mockUsername, 1, 20);

      expect(service.getFollowing).toHaveBeenCalledWith(mockUsername, 1, 20);
      expect(result).toEqual(mockFollowingResponse);
    });
  });

  describe('searchUsers', () => {
    const mockQuery = 'test';

    it('should search users successfully', async () => {
      const mockSearchResponse: UserSearchResponseDto = {
        users: [],
        totalCount: 0,
        hasMore: false,
      };

      mockSocialService.searchUsers.mockResolvedValue(mockSearchResponse);

      const result = await controller.searchUsers(mockQuery, { user: mockUser }, 1, 20);

      expect(service.searchUsers).toHaveBeenCalledWith(mockQuery, mockUser.id, 1, 20);
      expect(result).toEqual(mockSearchResponse);
    });
  });
}); 