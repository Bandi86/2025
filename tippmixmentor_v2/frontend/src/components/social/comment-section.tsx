'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  MessageCircle, 
  Reply, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Send,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  postId: string;
  userId: string;
  username: string;
  userAvatar?: string;
  parentId?: string;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  replies: Comment[];
  repliesCount: number;
}

interface CommentSectionProps {
  postId: string;
  onCommentAdded: () => void;
}

export function CommentSection({ postId, onCommentAdded }: CommentSectionProps) {
  const { user } = useAuth();
  const { api } = useApi();
  const { toast } = useToast();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.get<Comment[]>(`/social/posts/${postId}/comments`);
      setComments(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      
      const commentData = {
        content: newComment.trim(),
        ...(replyingTo && { parentId: replyingTo }),
      };

      await api.post(`/social/posts/${postId}/comments`, commentData);
      
      setNewComment('');
      setReplyingTo(null);
      fetchComments();
      onCommentAdded();
      
      toast({
        title: 'Comment added!',
        description: 'Your comment has been posted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const comment = findComment(commentId);
      if (!comment) return;

      if (comment.isLikedByCurrentUser) {
        await api.delete(`/social/comments/${commentId}/like`);
        updateCommentLikes(commentId, false);
      } else {
        await api.post(`/social/comments/${commentId}/like`);
        updateCommentLikes(commentId, true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to like comment',
        variant: 'destructive',
      });
    }
  };

  const handleEditComment = async (commentId: string) => {
    try {
      setIsSubmitting(true);
      await api.put(`/social/comments/${commentId}`, { content: editContent });
      
      setEditingComment(null);
      setEditContent('');
      fetchComments();
      
      toast({
        title: 'Comment updated!',
        description: 'Your comment has been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await api.delete(`/social/comments/${commentId}`);
      fetchComments();
      onCommentAdded();
      
      toast({
        title: 'Comment deleted',
        description: 'Your comment has been deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      });
    }
  };

  const findComment = (commentId: string): Comment | null => {
    const findInComments = (comments: Comment[]): Comment | null => {
      for (const comment of comments) {
        if (comment.id === commentId) return comment;
        const found = findInComments(comment.replies);
        if (found) return found;
      }
      return null;
    };
    return findInComments(comments);
  };

  const updateCommentLikes = (commentId: string, isLiked: boolean) => {
    const updateInComments = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            isLikedByCurrentUser: isLiked,
            likesCount: isLiked ? comment.likesCount + 1 : comment.likesCount - 1,
          };
        }
        return {
          ...comment,
          replies: updateInComments(comment.replies),
        };
      });
    };
    setComments(updateInComments(comments));
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <div key={comment.id} className={`space-y-3 ${isReply ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
      <div className="flex items-start space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.userAvatar} alt={comment.username} />
          <AvatarFallback>{getInitials(comment.username)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm">@{comment.username}</span>
            {comment.isEdited && (
              <Badge variant="outline" className="text-xs">
                Edited
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          
          {editingComment === comment.id ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
                placeholder="Edit your comment..."
              />
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleEditComment(comment.id)}
                  disabled={isSubmitting || !editContent.trim()}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Update
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingComment(null);
                    setEditContent('');
                  }}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm leading-relaxed">{comment.content}</p>
              
              <div className="flex items-center space-x-4 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLikeComment(comment.id)}
                  className={`flex items-center space-x-1 text-xs ${
                    comment.isLikedByCurrentUser ? 'text-red-500' : ''
                  }`}
                >
                  <Heart className={`h-3 w-3 ${comment.isLikedByCurrentUser ? 'fill-current' : ''}`} />
                  <span>{comment.likesCount}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(comment.id)}
                  className="flex items-center space-x-1 text-xs"
                >
                  <Reply className="h-3 w-3" />
                  <span>Reply</span>
                </Button>
                
                {user?.id === comment.userId && (
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingComment(comment.id);
                        setEditContent(comment.content);
                      }}
                      className="text-xs"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Reply Form */}
      {replyingTo === comment.id && (
        <div className="ml-11 space-y-2">
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSubmitComment(e);
          }}>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`Reply to @${comment.username}...`}
              className="min-h-[80px]"
            />
            <div className="flex items-center space-x-2">
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !newComment.trim()}
              >
                <Send className="h-3 w-3 mr-1" />
                Reply
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setReplyingTo(null);
                  setNewComment('');
                }}
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
      
      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  useEffect(() => {
    fetchComments();
  }, [postId]);

  if (!user) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">Sign in to view and add comments</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="min-h-[80px]"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !newComment.trim()}
          >
            <Send className="h-3 w-3 mr-1" />
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => renderComment(comment))
        ) : (
          <div className="text-center py-4">
            <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
} 