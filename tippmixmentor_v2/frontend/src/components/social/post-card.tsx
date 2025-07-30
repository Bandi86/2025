'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  MoreHorizontal, 
  Calendar, 
  Hash,
  Edit,
  Trash2,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { CommentSection } from './comment-section';
import { formatDistanceToNow } from 'date-fns';

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

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onRefresh: () => void;
}

export function PostCard({ post, onLike, onRefresh }: PostCardProps) {
  const { user } = useAuth();
  const { api } = useApi();
  const { toast } = useToast();
  
  const [showComments, setShowComments] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLike = () => {
    onLike(post.id);
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/social/posts/${post.id}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied!',
        description: 'Post link has been copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      setIsDeleting(true);
      await api.delete(`/social/posts/${post.id}`);
      toast({
        title: 'Post deleted',
        description: 'Your post has been deleted successfully',
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getPostTypeIcon = () => {
    switch (post.type) {
      case 'MATCH_RELATED':
        return <Calendar className="h-4 w-4" />;
      case 'PREDICTION':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getPostTypeLabel = () => {
    switch (post.type) {
      case 'MATCH_RELATED':
        return 'Match Discussion';
      case 'PREDICTION':
        return 'Prediction';
      default:
        return 'General';
    }
  };

  const getDisplayName = () => {
    if (post.user.firstName && post.user.lastName) {
      return `${post.user.firstName} ${post.user.lastName}`;
    }
    return post.user.username;
  };

  const getInitials = () => {
    if (post.user.firstName && post.user.lastName) {
      return `${post.user.firstName[0]}${post.user.lastName[0]}`;
    }
    return post.user.username.substring(0, 2).toUpperCase();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.user.avatar} alt={getDisplayName()} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{getDisplayName()}</span>
                {post.user.isVerified && (
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                )}
                <Badge variant="secondary" className="text-xs">
                  {getPostTypeLabel()}
                </Badge>
                {post.isEdited && (
                  <Badge variant="outline" className="text-xs">
                    Edited
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>@{post.user.username}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          
          {user?.id === post.user.id && (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditForm(true)}
                disabled={isDeleting}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Match Information */}
        {post.match && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="font-semibold">{post.match.homeTeam.name}</div>
                  <div className="text-sm text-muted-foreground">Home</div>
                </div>
                <div className="text-2xl font-bold">vs</div>
                <div className="text-center">
                  <div className="font-semibold">{post.match.awayTeam.name}</div>
                  <div className="text-sm text-muted-foreground">Away</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  {new Date(post.match.matchDate).toLocaleDateString()}
                </div>
                <Badge variant="outline">{post.match.status}</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Prediction Information */}
        {post.prediction && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-blue-900">Prediction</div>
                {post.prediction.predictedScore && (
                  <div className="text-sm text-blue-700">
                    Predicted Score: {post.prediction.predictedScore}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-700">
                  Confidence: {Math.round(post.prediction.confidence * 100)}%
                </div>
                <div className="text-xs text-blue-600">
                  H: {Math.round(post.prediction.homeWinProb * 100)}% | 
                  D: {Math.round(post.prediction.drawProb * 100)}% | 
                  A: {Math.round(post.prediction.awayWinProb * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {post.hashtags.map((hashtag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <Hash className="h-3 w-3 mr-1" />
                {hashtag}
              </Badge>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center space-x-1 ${
                post.isLikedByCurrentUser ? 'text-red-500' : ''
              }`}
            >
              <Heart className={`h-4 w-4 ${post.isLikedByCurrentUser ? 'fill-current' : ''}`} />
              <span>{post.likesCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post.commentsCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex items-center space-x-1"
            >
              <Share className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t">
            <CommentSection 
              postId={post.id}
              onCommentAdded={() => {
                // Refresh comments count
                onRefresh();
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
} 