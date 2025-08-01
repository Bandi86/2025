import { useState, useEffect } from 'react';
import { Badge } from './badge';
import { Button } from './button';
import { Bookmark, TrendingUp, Target, Clock, Star, Zap } from 'lucide-react';

export type QuickFilterType = 
  | 'my_feed'
  | 'live_value'
  | 'second_half_momentum'
  | 'favorites_underperforming'
  | 'comeback_potential'
  | 'my_leagues';

interface QuickFilter {
  id: QuickFilterType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  proOnly?: boolean;
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'my_feed',
    label: 'My Feed',
    icon: Bookmark,
    description: 'Personalized matches based on your preferences',
  },
  {
    id: 'live_value',
    label: 'Live Value (O/U)',
    icon: Target,
    description: 'Over/Under opportunities with high confidence',
    proOnly: true,
  },
  {
    id: 'second_half_momentum',
    label: '2nd Half Momentum',
    icon: TrendingUp,
    description: 'Teams gaining momentum in second half',
    proOnly: true,
  },
  {
    id: 'favorites_underperforming',
    label: 'Favorites Struggling',
    icon: Star,
    description: 'Top teams underperforming expectations',
    proOnly: true,
  },
  {
    id: 'comeback_potential',
    label: 'Comeback Potential',
    icon: Zap,
    description: 'Matches with high comeback probability',
    proOnly: true,
  },
  {
    id: 'my_leagues',
    label: 'My Leagues',
    icon: Bookmark,
    description: 'Matches from your followed leagues',
  },
];

interface QuickFiltersProps {
  selectedFilter: QuickFilterType;
  onFilterChange: (filter: QuickFilterType) => void;
  isProUser?: boolean;
  className?: string;
}

export function QuickFilters({ 
  selectedFilter, 
  onFilterChange, 
  isProUser = false,
  className = '' 
}: QuickFiltersProps) {
  const [savedStrategies, setSavedStrategies] = useState<string[]>([]);

  // Load saved strategies from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tmx_saved_strategies');
      if (saved) {
        setSavedStrategies(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveStrategy = () => {
    const strategyName = `Strategy ${savedStrategies.length + 1}`;
    const newStrategies = [...savedStrategies, strategyName];
    setSavedStrategies(newStrategies);
    localStorage.setItem('tmx_saved_strategies', JSON.stringify(newStrategies));
  };

  const availableFilters = QUICK_FILTERS.filter(filter => 
    !filter.proOnly || isProUser
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {availableFilters.map((filter) => {
          const Icon = filter.icon;
          const isSelected = selectedFilter === filter.id;
          
          return (
            <Button
              key={filter.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(filter.id)}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {filter.label}
              {filter.proOnly && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  PRO
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Save Strategy Button (Pro only) */}
      {isProUser && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveStrategy}
            className="flex items-center gap-2"
          >
            <Bookmark className="w-4 h-4" />
            Save Strategy
          </Button>
          {savedStrategies.length > 0 && (
            <span className="text-sm text-gray-500">
              {savedStrategies.length} saved strategies
            </span>
          )}
        </div>
      )}

      {/* Filter Description */}
      <div className="text-sm text-gray-600">
        {QUICK_FILTERS.find(f => f.id === selectedFilter)?.description}
      </div>
    </div>
  );
} 