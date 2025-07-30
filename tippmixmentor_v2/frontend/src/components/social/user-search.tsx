'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  UserPlus, 
  UserMinus, 
  Users, 
  TrendingUp,
  MapPin,
  Globe,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';

interface User {
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
  createdAt: string;
  updatedAt: string;
}

interface UserSearchResponse {
  users: User[];
  totalCount: number;
  hasMore: boolean;
}

export function UserSearch() {
  const { user } = useAuth();
  const { api } = useApi();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const searchUsers = async (query: string, pageNum: number = 1, append: boolean = false) => {
    if (!query.trim()) {
      setUsers([]);
      setHasMore(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get<UserSearchResponse>(
        `/social/search/users?q=${encodeURIComponent(query)}&page=${pageNum}&limit=10`
      );
      
      if (append) {
        setUsers(prev => [...prev, ...response.data.users]);
      } else {
        setUsers(response.data.users);
      }
      
      setHasMore(response.data.hasMore);
      setPage(pageNum);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (username: string) => {
    try {
      await api.post(`/social/users/${username}/follow`);
      setFollowing(prev => new Set(prev).add(username));
      setUsers(prev => prev.map(u => 
        u.username === username 
          ? { ...u, isFollowedByCurrentUser: true, followersCount: u.followersCount + 1 }
          : u
      ));
      
      toast({
        title: 'Following!',
        description: `You are now following @${username}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to follow user',
        variant: 'destructive',
      });
    }
  };

  const handleUnfollow = async (username: string) => {
    try {
      await api.delete(`/social/users/${username}/follow`);
      setFollowing(prev => {
        const newSet = new Set(prev);
        newSet.delete(username);
        return newSet;
      });
      setUsers(prev => prev.map(u => 
        u.username === username 
          ? { ...u, isFollowedByCurrentUser: false, followersCount: u.followersCount - 1 }
          : u
      ));
      
      toast({
        title: 'Unfollowed',
        description: `You are no longer following @${username}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unfollow user',
        variant: 'destructive',
      });
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      searchUsers(debouncedSearchQuery, page + 1, true);
    }
  };

  const getDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username;
  };

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    if (debouncedSearchQuery) {
      searchUsers(debouncedSearchQuery);
    } else {
      setUsers([]);
      setHasMore(false);
    }
  }, [debouncedSearchQuery]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Discover Users</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username, first name, or last name..."
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            <div className="space-y-3">
              {loading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              )}

              {!loading && users.length > 0 && (
                <>
                  {users.map((user) => (
                    <Card key={user.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={user.avatar} alt={getDisplayName(user)} />
                              <AvatarFallback>{getInitials(user)}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold">{getDisplayName(user)}</span>
                                {user.isVerified && (
                                  <CheckCircle className="h-4 w-4 text-blue-500" />
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  @{user.username}
                                </Badge>
                              </div>
                              
                              {user.bio && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {user.bio}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                {user.location && (
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{user.location}</span>
                                  </div>
                                )}
                                {user.favoriteTeam && (
                                  <div className="flex items-center space-x-1">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>{user.favoriteTeam}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-4 text-xs">
                                <div className="flex items-center space-x-1">
                                  <Users className="h-3 w-3" />
                                  <span>{user.followersCount} followers</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <TrendingUp className="h-3 w-3" />
                                  <span>{Math.round(user.predictionAccuracy * 100)}% accuracy</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span>{user.postsCount} posts</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-2">
                            {user.id !== user.userId && (
                              <Button
                                variant={user.isFollowedByCurrentUser ? "outline" : "default"}
                                size="sm"
                                onClick={() => {
                                  if (user.isFollowedByCurrentUser) {
                                    handleUnfollow(user.username);
                                  } else {
                                    handleFollow(user.username);
                                  }
                                }}
                                className="flex items-center space-x-1"
                              >
                                {user.isFollowedByCurrentUser ? (
                                  <>
                                    <UserMinus className="h-3 w-3" />
                                    <span>Unfollow</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="h-3 w-3" />
                                    <span>Follow</span>
                                  </>
                                )}
                              </Button>
                            )}
                            
                            {user.achievements.length > 0 && (
                              <div className="flex items-center space-x-1">
                                {user.achievements.slice(0, 3).map((achievement, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {achievement}
                                  </Badge>
                                ))}
                                {user.achievements.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{user.achievements.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {hasMore && (
                    <div className="text-center">
                      <Button variant="outline" onClick={loadMore}>
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              )}

              {!loading && searchQuery && users.length === 0 && (
                <div className="text-center py-8">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No users found</h3>
                  <p className="text-muted-foreground">
                    Try searching with a different username or name.
                  </p>
                </div>
              )}

              {!loading && !searchQuery && (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Search for users</h3>
                  <p className="text-muted-foreground">
                    Enter a username, first name, or last name to discover other football prediction enthusiasts.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 