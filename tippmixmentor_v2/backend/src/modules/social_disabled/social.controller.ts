import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SocialService } from './social.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/comment.dto';
import { UpdateCommentDto } from './dto/comment.dto';
import { UpdateUserProfileDto } from './dto/user-profile.dto';
import { PostResponseDto, PostFeedResponseDto } from './dto/post-response.dto';
import { CommentResponseDto } from './dto/comment.dto';
import { UserProfileResponseDto, UserFollowResponseDto, UserSearchResponseDto } from './dto/user-profile.dto';

@ApiTags('Social Media')
@Controller('social')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // =============================================================================
  // POSTS
  // =============================================================================

  @Post('posts')
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPost(
    @Request() req,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostResponseDto> {
    return this.socialService.createPost(req.user.id, createPostDto);
  }

  @Get('posts/:postId')
  @ApiOperation({ summary: 'Get a specific post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Post retrieved successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPost(
    @Param('postId') postId: string,
    @Request() req,
  ): Promise<PostResponseDto> {
    return this.socialService.getPost(postId, req.user.id);
  }

  @Put('posts/:postId')
  @ApiOperation({ summary: 'Update a post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not your post' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async updatePost(
    @Param('postId') postId: string,
    @Request() req,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    return this.socialService.updatePost(postId, req.user.id, updatePostDto);
  }

  @Delete('posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({ status: 204, description: 'Post deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your post' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async deletePost(
    @Param('postId') postId: string,
    @Request() req,
  ): Promise<void> {
    return this.socialService.deletePost(postId, req.user.id);
  }

  @Get('feed')
  @ApiOperation({ summary: 'Get user feed (posts from followed users and public posts)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Posts per page' })
  @ApiResponse({
    status: 200,
    description: 'Feed retrieved successfully',
    type: PostFeedResponseDto,
  })
  async getFeed(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<PostFeedResponseDto> {
    return this.socialService.getFeed(req.user.id, page, limit);
  }

  @Get('users/:username/posts')
  @ApiOperation({ summary: 'Get posts from a specific user' })
  @ApiParam({ name: 'username', description: 'Username' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Posts per page' })
  @ApiResponse({
    status: 200,
    description: 'User posts retrieved successfully',
    type: PostFeedResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserPosts(
    @Param('username') username: string,
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<PostFeedResponseDto> {
    return this.socialService.getUserPosts(username, req.user.id, page, limit);
  }

  // =============================================================================
  // COMMENTS
  // =============================================================================

  @Post('posts/:postId/comments')
  @ApiOperation({ summary: 'Create a comment on a post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async createComment(
    @Param('postId') postId: string,
    @Request() req,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.socialService.createComment(postId, req.user.id, createCommentDto);
  }

  @Put('comments/:commentId')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({
    status: 200,
    description: 'Comment updated successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not your comment' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async updateComment(
    @Param('commentId') commentId: string,
    @Request() req,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.socialService.updateComment(commentId, req.user.id, updateCommentDto);
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 204, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your comment' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async deleteComment(
    @Param('commentId') commentId: string,
    @Request() req,
  ): Promise<void> {
    return this.socialService.deleteComment(commentId, req.user.id);
  }

  @Get('posts/:postId/comments')
  @ApiOperation({ summary: 'Get comments for a post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Comments per page' })
  @ApiResponse({
    status: 200,
    description: 'Comments retrieved successfully',
    type: [CommentResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPostComments(
    @Param('postId') postId: string,
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ): Promise<CommentResponseDto[]> {
    return this.socialService.getPostComments(postId, req.user.id, page, limit);
  }

  // =============================================================================
  // LIKES
  // =============================================================================

  @Post('posts/:postId/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Like a post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({ status: 204, description: 'Post liked successfully' })
  @ApiResponse({ status: 400, description: 'Post already liked' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async likePost(
    @Param('postId') postId: string,
    @Request() req,
  ): Promise<void> {
    return this.socialService.likePost(postId, req.user.id);
  }

  @Delete('posts/:postId/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({ status: 204, description: 'Post unliked successfully' })
  @ApiResponse({ status: 404, description: 'Like not found' })
  async unlikePost(
    @Param('postId') postId: string,
    @Request() req,
  ): Promise<void> {
    return this.socialService.unlikePost(postId, req.user.id);
  }

  @Post('comments/:commentId/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Like a comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 204, description: 'Comment liked successfully' })
  @ApiResponse({ status: 400, description: 'Comment already liked' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async likeComment(
    @Param('commentId') commentId: string,
    @Request() req,
  ): Promise<void> {
    return this.socialService.likeComment(commentId, req.user.id);
  }

  @Delete('comments/:commentId/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlike a comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 204, description: 'Comment unliked successfully' })
  @ApiResponse({ status: 404, description: 'Like not found' })
  async unlikeComment(
    @Param('commentId') commentId: string,
    @Request() req,
  ): Promise<void> {
    return this.socialService.unlikeComment(commentId, req.user.id);
  }

  // =============================================================================
  // USER PROFILES
  // =============================================================================

  @Get('profiles/:username')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiParam({ name: 'username', description: 'Username' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(
    @Param('username') username: string,
    @Request() req,
  ): Promise<UserProfileResponseDto> {
    return this.socialService.getUserProfile(username, req.user.id);
  }

  @Put('profiles')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserProfileResponseDto,
  })
  async updateUserProfile(
    @Request() req,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<UserProfileResponseDto> {
    return this.socialService.updateUserProfile(req.user.id, updateUserProfileDto);
  }

  // =============================================================================
  // FOLLOW SYSTEM
  // =============================================================================

  @Post('users/:username/follow')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({ name: 'username', description: 'Username to follow' })
  @ApiResponse({
    status: 201,
    description: 'User followed successfully',
    type: UserFollowResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Already following or cannot follow yourself' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async followUser(
    @Param('username') username: string,
    @Request() req,
  ): Promise<UserFollowResponseDto> {
    return this.socialService.followUser(req.user.id, username);
  }

  @Delete('users/:username/follow')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({ name: 'username', description: 'Username to unfollow' })
  @ApiResponse({ status: 204, description: 'User unfollowed successfully' })
  @ApiResponse({ status: 404, description: 'User or follow relationship not found' })
  async unfollowUser(
    @Param('username') username: string,
    @Request() req,
  ): Promise<void> {
    return this.socialService.unfollowUser(req.user.id, username);
  }

  @Get('users/:username/followers')
  @ApiOperation({ summary: 'Get user followers' })
  @ApiParam({ name: 'username', description: 'Username' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Followers per page' })
  @ApiResponse({
    status: 200,
    description: 'Followers retrieved successfully',
    type: UserSearchResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getFollowers(
    @Param('username') username: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<UserSearchResponseDto> {
    return this.socialService.getFollowers(username, page, limit);
  }

  @Get('users/:username/following')
  @ApiOperation({ summary: 'Get users that a user is following' })
  @ApiParam({ name: 'username', description: 'Username' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Following per page' })
  @ApiResponse({
    status: 200,
    description: 'Following users retrieved successfully',
    type: UserSearchResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getFollowing(
    @Param('username') username: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<UserSearchResponseDto> {
    return this.socialService.getFollowing(username, page, limit);
  }

  // =============================================================================
  // SEARCH
  // =============================================================================

  @Get('search/users')
  @ApiOperation({ summary: 'Search users' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Users per page' })
  @ApiResponse({
    status: 200,
    description: 'Users found successfully',
    type: UserSearchResponseDto,
  })
  async searchUsers(
    @Query('q') query: string,
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<UserSearchResponseDto> {
    return this.socialService.searchUsers(query, req.user.id, page, limit);
  }
} 