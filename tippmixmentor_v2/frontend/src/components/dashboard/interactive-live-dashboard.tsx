import { useState, useEffect } from 'react';
import { useLiveSummaryFeed } from '@/hooks/use-live-summary-feed';
import { useMatchDetail } from '@/hooks/use-match-detail';
import { useAuth } from '@/hooks/use-auth';
import { LiveMatchCard } from '@/components/ui/live-match-card';
import { PredictionCard } from '@/components/ui/prediction-card';
import { StatCard } from '@/components/ui/stat-card';
import { AgentStatus } from '@/components/ui/agent-status';
import { MatchDetailModal } from '@/components/ui/match-detail-modal';
import { QuickFilters, type QuickFilterType } from '@/components/ui/quick-filters';
import { StatusBanner } from '@/components/ui/status-banner';
import { VirtualizedMatchList } from '@/components/ui/virtualized-match-list';
import { StrategiesPanel } from '@/components/ui/strategies-panel';
import { OnboardingModal } from '@/components/ui/onboarding-modal';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, Loader2, Settings, Filter, Crown, Bookmark } from 'lucide-react';
import { LiveMatch } from '@/lib/api/dashboard-data';

export function InteractiveLiveDashboard() {
  const { isProUser, trialRemainingDays, isAuthenticated } = useAuth();
  
  // Use the new live summary feed hook for better performance
  const {
    data: liveData,
    loading: liveLoading,
    error: liveError,
    refresh: refreshLiveData,
    lastUpdatedAt,
  } = useLiveSummaryFeed();

  // State for selected match and modal
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  
  // Quick filter state
  const [selectedFilter, setSelectedFilter] = useState<QuickFilterType>('my_feed');
  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'scheduled' | 'finished'>('all');

  // New state for additional features
  const [showStrategiesPanel, setShowStrategiesPanel] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTrigger, setUpgradeTrigger] = useState<'high_confidence' | 'why_details' | 'pro_filters' | 'manual'>('manual');
  const [useVirtualizedList, setUseVirtualizedList] = useState(false);

  // Check if user needs onboarding
  useEffect(() => {
    if (isAuthenticated) {
      const hasPreferences = localStorage.getItem('tmx_user_leagues') && localStorage.getItem('tmx_user_markets');
      if (!hasPreferences) {
        setShowOnboardingModal(true);
      }
    }
  }, [isAuthenticated]);

  // Load saved filter preference
  useEffect(() => {
    const savedFilter = localStorage.getItem('tmx_selected_filter') as QuickFilterType;
    if (savedFilter) {
      setSelectedFilter(savedFilter);
    }
  }, []);

  // Save filter preference
  useEffect(() => {
    localStorage.setItem('tmx_selected_filter', selectedFilter);
  }, [selectedFilter]);

  // Get match details when a match is selected
  const {
    data: matchDetail,
    loading: detailLoading,
    error: detailError,
  } = useMatchDetail(selectedMatchId || undefined);

  // Safe fallbacks
  const liveMatches = liveData?.liveMatches || [];
  const totalMatches = liveData?.totalMatches || 0;
  const liveCount = liveData?.liveCount || 0;

  // Apply filters
  const filteredMatches = liveMatches.filter(match => {
    // Status filter
    if (filterStatus !== 'all' && match.status !== filterStatus) {
      return false;
    }

    // Quick filter logic
    switch (selectedFilter) {
      case 'my_feed':
        // Filter by user's selected leagues
        const userLeagues = JSON.parse(localStorage.getItem('tmx_user_leagues') || '[]');
        if (userLeagues.length > 0) {
          // For now, show all matches. Later filter by actual league IDs
          return true;
        }
        return true;
      case 'live_value':
        // Show matches with high confidence for over/under opportunities
        return match.confidence && match.confidence > 75;
      case 'second_half_momentum':
        // Show live matches in second half
        return match.status === 'live' && match.minute && match.minute > 45;
      case 'favorites_underperforming':
        // Show matches where favorites are losing
        return match.homeScore !== undefined && match.awayScore !== undefined && 
               match.homeScore < match.awayScore;
      case 'comeback_potential':
        // Show matches with close scores in second half
        return match.status === 'live' && match.minute && match.minute > 45 &&
               match.homeScore !== undefined && match.awayScore !== undefined &&
               Math.abs(match.homeScore - match.awayScore) <= 1;
      case 'my_leagues':
        // Filter by user's selected leagues
        const userLeagues2 = JSON.parse(localStorage.getItem('tmx_user_leagues') || '[]');
        if (userLeagues2.length > 0) {
          // For now, show all matches. Later filter by actual league IDs
          return true;
        }
        return true;
      default:
        return true;
    }
  });

  const handleMatchClick = (match: LiveMatch) => {
    // Check if this is a high-confidence match for Free users
    if (match.confidence && match.confidence > 80 && !isProUser) {
      setUpgradeTrigger('high_confidence');
      setShowUpgradeModal(true);
      return;
    }
    
    setSelectedMatchId(match.id || null);
    setShowMatchModal(true);
  };

  const handleCloseModal = () => {
    setShowMatchModal(false);
    setSelectedMatchId(null);
  };

  const handleStrategySelect = (strategy: any) => {
    setSelectedFilter(strategy.filterType);
    setShowStrategiesPanel(false);
  };

  const handleOnboardingComplete = (preferences: { leagues: string[], markets: string[] }) => {
    console.log('Onboarding completed:', preferences);
    // The preferences are already saved in localStorage by the modal
  };

  const handleUpgradeClick = (trigger: 'high_confidence' | 'why_details' | 'pro_filters' | 'manual') => {
    setUpgradeTrigger(trigger);
    setShowUpgradeModal(true);
  };

  // Mock data for other sections (would come from separate hooks)
  const predictions = [
    {
      id: '1',
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      prediction: 'HOME_WIN' as const,
      confidence: 78,
      odds: 2.1,
      stake: 100,
      potentialWin: 110,
      matchTime: '2024-01-15T20:00:00Z',
      league: 'Premier League',
      status: 'pending' as const
    }
  ];

  const stats = [
    {
      title: 'Live Matches',
      value: liveCount,
      change: 2,
      changeType: 'increase' as const,
      icon: 'activity' as const,
      color: 'green' as const,
      format: 'number' as const
    },
    {
      title: 'Total Matches',
      value: totalMatches,
      change: 5,
      changeType: 'increase' as const,
      icon: 'activity' as const,
      color: 'blue' as const,
      format: 'number' as const
    },
    {
      title: 'Avg Confidence',
      value: 72,
      change: 3,
      changeType: 'increase' as const,
      icon: 'target' as const,
      color: 'purple' as const,
      format: 'percentage' as const
    },
    {
      title: 'Success Rate',
      value: 68,
      change: 2,
      changeType: 'increase' as const,
      icon: 'trending' as const,
      color: 'green' as const,
      format: 'percentage' as const
    }
  ];

  const agents = [
    {
      id: '1',
      name: 'Momentum Tracker',
      type: 'prediction' as const,
      status: 'online' as const,
      accuracy: 78,
      predictionsMade: 156,
      lastActivity: '2 minutes ago',
      performance: {
        successRate: 78,
        avgResponseTime: 150,
        uptime: 99.5
      },
      currentTask: 'Analyzing live matches'
    }
  ];

  if (liveLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading live dashboard...</p>
        </div>
      </div>
    );
  }

  if (liveError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{liveError}</p>
          <Button onClick={refreshLiveData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <StatusBanner 
        lastUpdatedAt={lastUpdatedAt}
        onRefresh={refreshLiveData}
      />

      {/* Header with controls */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Interactive Live Dashboard</h2>
          <p className="text-gray-600">Real-time football insights and predictions</p>
          {!isProUser && trialRemainingDays && (
            <div className="mt-2 flex items-center gap-2 text-sm text-orange-600">
              <Crown className="w-4 h-4" />
              <span>Trial active - {trialRemainingDays} days remaining</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {/* Strategies Button */}
          {isProUser && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStrategiesPanel(true)}
              className="flex items-center gap-2"
            >
              <Bookmark className="w-4 h-4" />
              My Strategies
            </Button>
          )}
          
          {/* Filter Controls */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Matches</option>
              <option value="live">Live Only</option>
              <option value="scheduled">Scheduled</option>
              <option value="finished">Finished</option>
            </select>
          </div>
          
          {/* View Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseVirtualizedList(!useVirtualizedList)}
            className="flex items-center gap-2"
          >
            {useVirtualizedList ? 'Grid View' : 'List View'}
          </Button>
          
          <Button onClick={refreshLiveData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <QuickFilters
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        isProUser={isProUser}
      />

      {/* Stats Grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              changeType={stat.changeType}
              icon={stat.icon}
              color={stat.color}
              format={stat.format}
            />
          ))}
        </div>
      </div>

      {/* Live Matches */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Live Matches ({filteredMatches.length})
          </h3>
          <div className="text-sm text-gray-500">
            Showing {filteredMatches.length} of {liveMatches.length} matches
            {lastUpdatedAt && (
              <span className="ml-2">
                • updated {Math.floor((Date.now() - lastUpdatedAt) / 1000)}s ago
              </span>
            )}
          </div>
        </div>
        {filteredMatches.length > 0 ? (
          useVirtualizedList ? (
            <VirtualizedMatchList
              matches={filteredMatches}
              isProUser={isProUser}
              onMatchClick={handleMatchClick}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMatches.map((match) => (
                <LiveMatchCard
                  key={match.id}
                  id={match.id}
                  homeTeam={match.homeTeam}
                  awayTeam={match.awayTeam}
                  homeScore={match.homeScore}
                  awayScore={match.awayScore}
                  minute={match.minute}
                  status={match.status}
                  confidence={match.confidence}
                  league={match.league}
                  onClick={() => handleMatchClick(match)}
                  isProUser={isProUser}
                  isHighConfidence={match.confidence ? match.confidence > 80 : false}
                  drivers={[
                    {
                      name: 'xG Differential',
                      value: 1.8,
                      impact: 'positive',
                      description: 'Expected goals favor home team'
                    },
                    {
                      name: 'Shot Conversion',
                      value: 16.7,
                      impact: 'positive',
                      description: 'Above average conversion rate'
                    }
                  ]}
                  trendData={Array.from({ length: 10 }, () => Math.random() * 100)}
                />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No matches found with the current filter</p>
          </div>
        )}
      </div>

      {/* Recent Predictions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Predictions ({predictions.length})
        </h3>
        {predictions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {predictions.map((prediction) => (
              <PredictionCard
                key={prediction.id}
                homeTeam={prediction.homeTeam}
                awayTeam={prediction.awayTeam}
                prediction={prediction.prediction}
                confidence={prediction.confidence}
                odds={prediction.odds}
                stake={prediction.stake}
                potentialWin={prediction.potentialWin}
                matchTime={prediction.matchTime}
                league={prediction.league}
                status={prediction.status}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No predictions available</p>
          </div>
        )}
      </div>

      {/* AI Agents Status */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          AI Agents Status ({agents.length})
        </h3>
        {agents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <AgentStatus
                key={agent.id}
                name={agent.name}
                type={agent.type}
                status={agent.status}
                accuracy={agent.accuracy}
                predictionsMade={agent.predictionsMade}
                lastActivity={agent.lastActivity}
                performance={agent.performance}
                currentTask={agent.currentTask}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No agents available</p>
          </div>
        )}
      </div>

      {/* Data Status Footer */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
        <p>
          Last updated: {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : 'Unknown'}
        </p>
        <p>Auto-refresh every 30 seconds • Click matches for details</p>
      </div>

      {/* Modals */}
      {matchDetail && (
        <MatchDetailModal
          isOpen={showMatchModal}
          onClose={handleCloseModal}
          match={matchDetail}
        />
      )}

      <StrategiesPanel
        isOpen={showStrategiesPanel}
        onClose={() => setShowStrategiesPanel(false)}
        onStrategySelect={handleStrategySelect}
      />

      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onComplete={handleOnboardingComplete}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger={upgradeTrigger}
      />
    </div>
  );
} 