import { useState } from 'react';
import { Card, CardContent, CardHeader } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Clock, Target, TrendingUp, Star, Lock, Crown } from 'lucide-react';
import { WhyPopover } from './why-popover';

interface LiveMatchCardProps {
  id?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
  status: 'live' | 'finished' | 'scheduled';
  confidence?: number;
  league?: string;
  onClick?: () => void;
  className?: string;
  isProUser?: boolean;
  isHighConfidence?: boolean; // For Pro gating
  drivers?: Array<{
    name: string;
    value: number;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }>;
  trendData?: number[];
}

export function LiveMatchCard({
  id,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  minute,
  status,
  confidence,
  league,
  onClick,
  className = '',
  isProUser = false,
  isHighConfidence = false,
  drivers = [],
  trendData
}: LiveMatchCardProps) {
  const [isFollowed, setIsFollowed] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-500';
      case 'finished': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'LIVE';
      case 'finished': return 'FT';
      default: return 'SCHEDULED';
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'live': return 'border-l-green-500';
      case 'finished': return 'border-l-gray-500';
      default: return 'border-l-blue-500';
    }
  };

  const getBackgroundGradient = (status: string) => {
    switch (status) {
      case 'live': return 'bg-gradient-to-r from-green-50 to-white';
      case 'finished': return 'bg-gradient-to-r from-gray-50 to-white';
      default: return 'bg-gradient-to-r from-blue-50 to-white';
    }
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFollowed(!isFollowed);
    // TODO: Save to backend
  };

  const handleCardClick = () => {
    if (isHighConfidence && !isProUser) {
      // Show upgrade modal or handle Pro gating
      return;
    }
    onClick?.();
  };

  // Check if this card should be locked for Free users
  const isLocked = isHighConfidence && !isProUser;

  return (
    <Card 
      className={`border-l-4 ${getBorderColor(status)} ${getBackgroundGradient(status)} hover:shadow-md transition-shadow duration-200 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={getStatusColor(status)}>
              {getStatusText(status)}
            </Badge>
            {isHighConfidence && (
              <Badge variant="outline" className="text-xs">
                <Crown className="w-3 h-3 mr-1" />
                High Confidence
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {confidence && (
              <div className="flex items-center text-sm text-gray-600">
                <Target className="w-4 h-4 mr-1" />
                {confidence}%
              </div>
            )}
            {isProUser && (
              <WhyPopover
                confidence={confidence || 0}
                drivers={drivers}
                trendData={trendData}
                isProUser={isProUser}
              >
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <TrendingUp className="w-4 h-4" />
                </Button>
              </WhyPopover>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFollowClick}
              className={`h-6 w-6 p-0 ${isFollowed ? 'text-yellow-500' : 'text-gray-400'}`}
            >
              <Star className={`w-4 h-4 ${isFollowed ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
        {league && (
          <p className="text-xs text-gray-500">{league}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900">{homeTeam}</span>
            <span className="font-bold text-lg text-gray-900">{homeScore ?? '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900">{awayTeam}</span>
            <span className="font-bold text-lg text-gray-900">{awayScore ?? '-'}</span>
          </div>
          {minute && status === 'live' && (
            <div className="flex items-center justify-center text-sm text-green-600 font-medium">
              <Clock className="w-4 h-4 mr-1" />
              {minute}'
            </div>
          )}
        </div>

        {/* Pro Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg text-center max-w-xs">
              <Lock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <h4 className="font-semibold text-gray-900 mb-1">High-Confidence Signal</h4>
              <p className="text-sm text-gray-600 mb-3">
                Unlock instant access to our most accurate predictions with Pro.
              </p>
              <Button size="sm" className="w-full">
                Upgrade to Pro
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 