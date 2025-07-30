# Social Media Features

This module provides comprehensive social media functionality for the football prediction platform, allowing users to share posts, comment, like, follow each other, and interact in real-time.

## Features

### 🏷️ **Posts**
- Create, read, update, and delete posts
- Support for different post types (general, prediction, match commentary, analysis, news, question, poll)
- Optional image attachments
- Hashtag support
- Public/private post visibility
- Edit history tracking

### 💬 **Comments**
- Comment on posts with nested replies
- Edit and delete comments
- Like/unlike comments
- Real-time comment notifications

### ❤️ **Likes**
- Like/unlike posts and comments
- Real-time like notifications
- Like count tracking

### 👥 **User Profiles**
- Enhanced user profiles with bio, location, website
- Social media links (Twitter, Instagram, LinkedIn, YouTube)
- Favorite team and player
- Prediction accuracy and statistics
- Achievement and badge system
- Verification status

### 🔗 **Follow System**
- Follow/unfollow users
- Follower and following lists
- Real-time follow notifications
- Follower count tracking

### 🔍 **Search**
- Search users by username, first name, or last name
- Paginated results
- Follow status indication

### 📡 **Real-time Features**
- WebSocket-based real-time notifications
- Live feed updates
- Real-time post and comment notifications
- Live like and follow notifications

## API Endpoints

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/social/posts` | Create a new post |
| `GET` | `/social/posts/:postId` | Get a specific post |
| `PUT` | `/social/posts/:postId` | Update a post |
| `DELETE` | `/social/posts/:postId` | Delete a post |
| `GET` | `/social/feed` | Get user feed |
| `GET` | `/social/users/:username/posts` | Get user's posts |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/social/posts/:postId/comments` | Create a comment |
| `PUT` | `/social/comments/:commentId` | Update a comment |
| `DELETE` | `/social/comments/:commentId` | Delete a comment |
| `GET` | `/social/posts/:postId/comments` | Get post comments |

### Likes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/social/posts/:postId/like` | Like a post |
| `DELETE` | `/social/posts/:postId/like` | Unlike a post |
| `POST` | `/social/comments/:commentId/like` | Like a comment |
| `DELETE` | `/social/comments/:commentId/like` | Unlike a comment |

### User Profiles

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/social/profiles/:username` | Get user profile |
| `PUT` | `/social/profiles` | Update current user profile |

### Follow System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/social/users/:username/follow` | Follow a user |
| `DELETE` | `/social/users/:username/follow` | Unfollow a user |
| `GET` | `/social/users/:username/followers` | Get user's followers |
| `GET` | `/social/users/:username/following` | Get users that a user is following |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/social/search/users` | Search users |

## WebSocket Events

### Connection Events
- `connected` - User connected to social gateway
- `joined_feed` - User joined social feed
- `left_feed` - User left social feed
- `joined_user_posts` - User joined specific user's posts
- `left_user_posts` - User left specific user's posts
- `joined_post_comments` - User joined post comments
- `left_post_comments` - User left post comments

### Real-time Notifications
- `new_post` - New post created
- `post_liked` - Post was liked
- `post_unliked` - Post was unliked
- `new_comment` - New comment added
- `comment_liked` - Comment was liked
- `comment_unliked` - Comment was unliked
- `new_follower` - New follower
- `user_unfollowed` - User unfollowed
- `post_count_changed` - User's post count changed
- `follower_count_changed` - User's follower count changed

## Data Models

### Post
```typescript
{
  id: string;
  userId: string;
  content: string;
  type: PostType;
  matchId?: string;
  predictionId?: string;
  imageUrl?: string;
  isPublic: boolean;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user: UserSummary;
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser: boolean;
  hashtags: string[];
  match?: MatchSummary;
  prediction?: PredictionSummary;
}
```

### Comment
```typescript
{
  id: string;
  content: string;
  postId: string;
  userId: string;
  username: string;
  userAvatar?: string;
  parentId?: string;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  replies: Comment[];
  repliesCount: number;
}
```

### UserProfile
```typescript
{
  id: string;
  userId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  favoriteTeam?: string;
  favoritePlayer?: string;
  predictionAccuracy: number;
  totalPredictions: number;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  achievements: string[];
  badges: string[];
  isVerified: boolean;
  isFollowedByCurrentUser: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Usage Examples

### Creating a Post
```typescript
const post = await socialService.createPost(userId, {
  content: "What do you think about tonight's match? I predict a 2-1 win for the home team!",
  type: PostType.PREDICTION,
  matchId: "match-123",
  hashtags: ["#football", "#prediction", "#matchday"],
  isPublic: true
});
```

### Following a User
```typescript
const follow = await socialService.followUser(followerId, "username");
```

### Getting User Feed
```typescript
const feed = await socialService.getFeed(userId, 1, 20);
```

### Searching Users
```typescript
const results = await socialService.searchUsers("john", currentUserId, 1, 20);
```

## WebSocket Usage

### Connecting to Social Gateway
```javascript
const socket = io('http://localhost:3000/social', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connected', (data) => {
  console.log('Connected to social gateway:', data);
});

socket.on('new_post', (data) => {
  console.log('New post:', data.post);
});

socket.on('post_liked', (data) => {
  console.log('Post liked:', data);
});
```

### Joining Rooms
```javascript
// Join social feed
socket.emit('join_feed');

// Join specific user's posts
socket.emit('join_user_posts', { username: 'john' });

// Join post comments
socket.emit('join_post_comments', { postId: 'post-123' });
```

## Database Schema

The social media features use the following database tables:

- `posts` - User posts
- `comments` - Post comments with nested replies
- `likes` - Post and comment likes
- `user_follows` - User follow relationships
- `user_profiles` - Enhanced user profiles
- `hashtags` - Hashtag definitions
- `post_hashtags` - Post-hashtag relationships
- `achievements` - User achievements
- `badges` - User badges

## Security Features

- JWT authentication required for all endpoints
- Users can only edit/delete their own posts and comments
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS protection
- WebSocket authentication

## Performance Optimizations

- Pagination for all list endpoints
- Database indexing on frequently queried fields
- Redis caching for frequently accessed data
- Efficient database queries with proper joins
- WebSocket rooms for targeted notifications

## Testing

The module includes comprehensive unit tests covering:

- Post creation, reading, updating, and deletion
- Comment functionality
- Like/unlike operations
- User profile management
- Follow system
- Search functionality
- Error handling and edge cases

Run tests with:
```bash
npm test -- --testPathPattern=social.service.spec.ts
```

## Future Enhancements

- **Advanced Content Moderation**: AI-powered content filtering
- **Trending Topics**: Hashtag trending algorithms
- **Post Scheduling**: Schedule posts for future publication
- **Content Analytics**: Post performance metrics
- **Advanced Search**: Full-text search with filters
- **Media Upload**: Image and video upload support
- **Post Templates**: Predefined post templates for predictions
- **Community Features**: Groups and channels
- **Live Streaming**: Real-time match commentary
- **Gamification**: Points, leaderboards, and challenges 