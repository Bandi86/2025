'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Hash, X, Send, Image as ImageIcon } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

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

interface CreatePostFormProps {
  onPostCreated: (post: Post) => void;
  onCancel: () => void;
  initialType?: 'GENERAL' | 'MATCH_RELATED' | 'PREDICTION';
  initialMatchId?: string;
  initialPredictionId?: string;
}

export function CreatePostForm({ 
  onPostCreated, 
  onCancel, 
  initialType = 'GENERAL',
  initialMatchId,
  initialPredictionId 
}: CreatePostFormProps) {
  const { api } = useApi();
  const { toast } = useToast();
  
  const [content, setContent] = useState('');
  const [type, setType] = useState<'GENERAL' | 'MATCH_RELATED' | 'PREDICTION'>(initialType);
  const [isPublic, setIsPublic] = useState(true);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [currentHashtag, setCurrentHashtag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter some content for your post',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const postData = {
        content: content.trim(),
        type,
        isPublic,
        hashtags,
        ...(initialMatchId && { matchId: initialMatchId }),
        ...(initialPredictionId && { predictionId: initialPredictionId }),
      };

      const response = await api.post<Post>('/social/posts', postData);
      
      toast({
        title: 'Post created!',
        description: 'Your post has been published successfully',
      });
      
      onPostCreated(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHashtagAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const hashtag = currentHashtag.trim().replace('#', '');
      
      if (hashtag && !hashtags.includes(hashtag) && hashtags.length < 10) {
        setHashtags([...hashtags, hashtag]);
        setCurrentHashtag('');
      }
    }
  };

  const handleHashtagRemove = (hashtagToRemove: string) => {
    setHashtags(hashtags.filter(tag => tag !== hashtagToRemove));
  };

  const extractHashtagsFromContent = () => {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    if (matches) {
      const newHashtags = matches.map(tag => tag.slice(1)).filter(tag => !hashtags.includes(tag));
      if (newHashtags.length > 0) {
        setHashtags([...hashtags, ...newHashtags.slice(0, 10 - hashtags.length)]);
      }
    }
  };

  const characterCount = content.length;
  const maxCharacters = 1000;
  const isOverLimit = characterCount > maxCharacters;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Create a Post</span>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Post Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="post-type">Post Type</Label>
            <Select value={type} onValueChange={(value: any) => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select post type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GENERAL">General Discussion</SelectItem>
                <SelectItem value="MATCH_RELATED">Match Discussion</SelectItem>
                <SelectItem value="PREDICTION">Prediction</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">What's on your mind?</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, predictions, or match analysis..."
              className="min-h-[120px] resize-none"
              maxLength={maxCharacters}
            />
            <div className="flex justify-between items-center text-sm">
              <span className={`${isOverLimit ? 'text-red-500' : 'text-muted-foreground'}`}>
                {characterCount}/{maxCharacters} characters
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={extractHashtagsFromContent}
                disabled={!content.includes('#')}
              >
                Extract Hashtags
              </Button>
            </div>
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label htmlFor="hashtags">Hashtags (optional)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {hashtags.map((hashtag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {hashtag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleHashtagRemove(hashtag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            {hashtags.length < 10 && (
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={currentHashtag}
                  onChange={(e) => setCurrentHashtag(e.target.value)}
                  onKeyDown={handleHashtagAdd}
                  placeholder="Add hashtags..."
                  className="w-full pl-10 pr-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Press Enter or Space to add hashtags. Maximum 10 hashtags.
            </p>
          </div>

          {/* Privacy Setting */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="privacy">Public Post</Label>
              <p className="text-sm text-muted-foreground">
                {isPublic ? 'Anyone can see this post' : 'Only you can see this post'}
              </p>
            </div>
            <Switch
              id="privacy"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-2">
              <Button type="button" variant="outline" size="sm">
                <ImageIcon className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isOverLimit || !content.trim()}
                className="flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmitting ? 'Publishing...' : 'Publish Post'}</span>
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 