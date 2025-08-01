import { useDashboardData } from '@/hooks/use-dashboard-data'
import { LiveMatchCard } from '@/components/ui/live-match-card'
import { PredictionCard } from '@/components/ui/prediction-card'
import { StatCard } from '@/components/ui/stat-card'
import { AgentStatus } from '@/components/ui/agent-status'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react'

export function LiveDashboard() {
  const { 
    liveMatches, 
    predictions, 
    stats, 
    agents, 
    loading, 
    error, 
    refreshData 
  } = useDashboardData(30000) // Refresh every 30 seconds

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Dashboard</h2>
          <p className="text-gray-600">Real-time data updates every 30 seconds</p>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Live Matches ({liveMatches.length})
        </h3>
        {liveMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveMatches.slice(0, 6).map((match) => (
              <LiveMatchCard
                key={match.id}
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
                homeScore={match.homeScore}
                awayScore={match.awayScore}
                minute={match.minute}
                status={match.status}
                confidence={match.confidence}
                league={match.league}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No live matches at the moment</p>
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
            {predictions.slice(0, 6).map((prediction) => (
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
        <p>Last updated: {new Date().toLocaleTimeString()}</p>
        <p>Auto-refresh every 30 seconds</p>
      </div>
    </div>
  )
} 