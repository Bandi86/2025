'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MessageCircle, Share, MoreHorizontal, User, Calendar, Hash } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { CreatePostForm } from './create-post-form';
import { PostCard } from './post-card';
import { UserSearch } from './user-search';

interface Post {
  id: string;
  content: string;
  type: 'GENERAL' | 'MATCH_RELATED' | 'PREDICTION';
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  isEdited: boolean;
  editedAt?: string;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    isVerified: boolean;
  };
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser: boolean;
  hashtags: string[];
  match?: {
    id: string;
    homeTeam: { name: string; logo?: string };
    awayTeam: { name: string; logo?: string };
    matchDate: string;
    status: string;
  };
  prediction?: {
    id: string;
    predictedScore?: string;
    confidence: number;
    homeWinProb: number;
    drawProb: number;
    awayWinProb: number;
  };
}

interface PostFeedResponse {
  posts: Post[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

export function SocialFeed() {
  const { user } = useAuth();
  const { api } = useApi();
  const { toast } = useToast();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('feed');
  const [showCreatePost, setShowCreatePost] = useState(false);

  const fetchPosts = async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true);
      const response = await api.get<PostFeedResponse>(`/social/feed?page=${pageNum}&limit=10`);
      
      if (append) {
        setPosts(prev => [...prev, ...response.data.posts]);
      } else {
        setPosts(response.data.posts);
      }
      
      setHasMore(response.data.hasMore);
      setPage(pageNum);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.isLikedByCurrentUser) {
        await api.delete(`/social/posts/${postId}/like`);
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, isLikedByCurrentUser: false, likesCount: p.likesCount - 1 }
            : p
        ));
      } else {
        await api.post(`/social/posts/${postId}/like`);
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, isLikedByCurrentUser: true, likesCount: p.likesCount + 1 }
            : p
        ));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to like post',
        variant: 'destructive',
      });
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
    setShowCreatePost(false);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchPosts(page + 1, true);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sign in to view your feed</h3>
            <p className="text-muted-foreground">
              Connect with other football prediction enthusiasts and share your insights.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Social Feed</h2>
            <Button onClick={() => setShowCreatePost(true)}>
              Create Post
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="discover">Discover</TabsTrigger>
            </TabsList>
            
            <TabsContent value="feed" className="space-y-4">
              {showCreatePost && (
                <CreatePostForm 
                  onPostCreated={handlePostCreated}
                  onCancel={() => setShowCreatePost(false)}
                />
              )}
              
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLikePost}
                    onRefresh={() => fetchPosts()}
                  />
                ))}
                
                {loading && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                )}
                
                {hasMore && !loading && (
                  <div className="text-center">
                    <Button variant="outline" onClick={loadMore}>
                      Load More
                    </Button>
                  </div>
                )}
                
                {!loading && posts.length === 0 && (
                  <div className="text-center py-8">
                    <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Follow some users or create your first post to see content here.
                    </p>
                    <Button onClick={() => setShowCreatePost(true)}>
                      Create Your First Post
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="trending" className="space-y-4">
              <div className="text-center py-8">
                <Hash className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Trending Posts</h3>
                <p className="text-muted-foreground">
                  Coming soon! See what's trending in the football prediction community.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="discover" className="space-y-4">
              <UserSearch />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 