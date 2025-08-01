'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Heart, 
  Share, 
  MoreHorizontal,
  Send,
  TrendingUp,
  Users,
  Globe
} from 'lucide-react';

interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    username: string;
    verified: boolean;
  };
  content: string;
  timestamp: Date;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  type: 'prediction' | 'analysis' | 'general' | 'tip';
  tags: string[];
  matchInfo?: {
    homeTeam: string;
    awayTeam: string;
    prediction: string;
    confidence: number;
  };
}

export function SocialFeed() {
  const [posts, setPosts] = React.useState<Post[]>([
    {
      id: '1',
      author: {
        name: 'Alex Thompson',
        avatar: '/avatars/alex.jpg',
        username: '@alex_thompson',
        verified: true
      },
      content: 'Just made a prediction for Manchester City vs Arsenal. The AI model shows strong confidence in a home win. What do you think? 🤔',
      timestamp: new Date(Date.now() - 1800000),
      likes: 24,
      comments: 8,
      shares: 3,
      isLiked: false,
      type: 'prediction',
      tags: ['Premier League', 'Prediction', 'AI'],
      matchInfo: {
        homeTeam: 'Manchester City',
        awayTeam: 'Arsenal',
        prediction: 'Home Win',
        confidence: 87
      }
    },
    {
      id: '2',
      author: {
        name: 'Sarah Chen',
        avatar: '/avatars/sarah.jpg',
        username: '@sarah_chen',
        verified: false
      },
      content: 'Interesting analysis on how weather conditions affect match outcomes. Rain seems to increase draw probability significantly! ☔',
      timestamp: new Date(Date.now() - 3600000),
      likes: 15,
      comments: 12,
      shares: 7,
      isLiked: true,
      type: 'analysis',
      tags: ['Analysis', 'Weather', 'Statistics']
    },
    {
      id: '3',
      author: {
        name: 'Mike Rodriguez',
        avatar: '/avatars/mike.jpg',
        username: '@mike_rodriguez',
        verified: true
      },
      content: 'Pro tip: Always check recent form and head-to-head stats before making predictions. The AI is great, but context matters! 💡',
      timestamp: new Date(Date.now() - 5400000),
      likes: 31,
      comments: 5,
      shares: 9,
      isLiked: false,
      type: 'tip',
      tags: ['Tips', 'Strategy', 'Analysis']
    },
    {
      id: '4',
      author: {
        name: 'Emma Wilson',
        avatar: '/avatars/emma.jpg',
        username: '@emma_wilson',
        verified: false
      },
      content: 'Liverpool vs Chelsea tonight! My prediction model gives Liverpool a 65% chance of winning. The odds look good for a home win. 🔴',
      timestamp: new Date(Date.now() - 7200000),
      likes: 18,
      comments: 14,
      shares: 4,
      isLiked: false,
      type: 'prediction',
      tags: ['Premier League', 'Liverpool', 'Chelsea'],
      matchInfo: {
        homeTeam: 'Liverpool',
        awayTeam: 'Chelsea',
        prediction: 'Home Win',
        confidence: 65
      }
    }
  ]);

  const [newPost, setNewPost] = React.useState('');

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleShare = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, shares: post.shares + 1 }
        : post
    ));
  };

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPost.trim()) {
      const newPostObj: Post = {
        id: Date.now().toString(),
        author: {
          name: 'You',
          avatar: '/avatars/user.jpg',
          username: '@your_username',
          verified: false
        },
        content: newPost,
        timestamp: new Date(),
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false,
        type: 'general',
        tags: []
      };
      setPosts(prev => [newPostObj, ...prev]);
      setNewPost('');
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'now';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'prediction': return 'bg-blue-100 text-blue-800';
      case 'analysis': return 'bg-green-100 text-green-800';
      case 'tip': return 'bg-yellow-100 text-yellow-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community Feed</h1>
          <p className="text-gray-600 mt-1">
            Connect with other prediction enthusiasts and share insights
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Trending</span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today's Posts</p>
                <p className="text-2xl font-bold">89</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Heart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Likes</p>
                <p className="text-2xl font-bold">2,456</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Globe className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Countries</p>
                <p className="text-2xl font-bold">23</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Post */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmitPost} className="space-y-4">
            <div className="flex items-start space-x-3">
              <Avatar className="w-10 h-10">
                <img src="/avatars/user.jpg" alt="Your avatar" />
              </Avatar>
              <div className="flex-1">
                <Input
                  placeholder="What's on your mind? Share a prediction, analysis, or tip..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="border-0 focus:ring-0 text-lg"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" type="button">
                  📊 Add Prediction
                </Button>
                <Button variant="outline" size="sm" type="button">
                  📈 Add Analysis
                </Button>
                <Button variant="outline" size="sm" type="button">
                  💡 Add Tip
                </Button>
              </div>
              <Button type="submit" disabled={!newPost.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Post
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map(post => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <Avatar className="w-12 h-12">
                  <img src={post.author.avatar} alt={post.author.name} />
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
                      {post.author.verified && (
                        <Badge variant="outline" className="text-xs">Verified</Badge>
                      )}
                      <span className="text-sm text-gray-500">{post.author.username}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getTypeColor(post.type)}>
                        {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                      </Badge>
                      <span className="text-sm text-gray-500">{formatTimeAgo(post.timestamp)}</span>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-gray-900 mb-4 leading-relaxed">{post.content}</p>

                  {post.matchInfo && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-900">
                            {post.matchInfo.homeTeam} vs {post.matchInfo.awayTeam}
                          </h4>
                          <p className="text-sm text-blue-700">
                            Prediction: {post.matchInfo.prediction} ({post.matchInfo.confidence}% confidence)
                          </p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          {post.matchInfo.prediction}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-2 ${post.isLiked ? 'text-red-600' : 'text-gray-600'}`}
                      >
                        <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                        <span>{post.likes}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-600">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(post.id)}
                        className="flex items-center space-x-2 text-gray-600"
                      >
                        <Share className="w-4 h-4" />
                        <span>{post.shares}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 