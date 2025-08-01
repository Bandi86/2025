import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { Badge } from './badge'
import { Button } from './button'
import { Card, CardContent } from './card'
import { Clock, Target, MapPin, Users, TrendingUp, BarChart3 } from 'lucide-react'

interface MatchDetailModalProps {
  isOpen: boolean
  onClose: () => void
  match: {
    id: string
    homeTeam: string
    awayTeam: string
    homeScore?: number
    awayScore?: number
    minute?: number
    status: 'live' | 'finished' | 'scheduled'
    confidence?: number
    league?: string
    matchTime?: string
    venue?: string
    referee?: string
    attendance?: number
    homeTeamStats?: {
      possession: number
      shots: number
      shotsOnTarget: number
      corners: number
      fouls: number
    }
    awayTeamStats?: {
      possession: number
      shots: number
      shotsOnTarget: number
      corners: number
      fouls: number
    }
  }
}

export function MatchDetailModal({ isOpen, onClose, match }: MatchDetailModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-green-600 bg-green-50 border-green-200'
      case 'finished': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'LIVE'
      case 'finished': return 'FINISHED'
      default: return 'SCHEDULED'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Match Details</span>
            <Badge variant="secondary" className={getStatusColor(match.status)}>
              {getStatusText(match.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Match Header */}
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">{match.league}</div>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{match.homeTeam}</div>
                <div className="text-3xl font-bold text-blue-600">
                  {match.homeScore ?? '-'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">vs</div>
                {match.status === 'live' && match.minute && (
                  <div className="text-sm text-green-600 font-medium">
                    {match.minute}'
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{match.awayTeam}</div>
                <div className="text-3xl font-bold text-blue-600">
                  {match.awayScore ?? '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Match Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {match.matchTime && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Kick-off:</span>
                    <span className="font-medium">{new Date(match.matchTime).toLocaleString()}</span>
                  </div>
                )}
                {match.venue && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Venue:</span>
                    <span className="font-medium">{match.venue}</span>
                  </div>
                )}
                {match.referee && (
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Referee:</span>
                    <span className="font-medium">{match.referee}</span>
                  </div>
                )}
                {match.attendance && (
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Attendance:</span>
                    <span className="font-medium">{match.attendance.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Statistics */}
          {(match.homeTeamStats || match.awayTeamStats) && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Statistics</h3>
                <div className="space-y-4">
                  {/* Possession */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-600 w-20">
                      {match.homeTeamStats?.possession}%
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${match.homeTeamStats?.possession}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-600 w-20 text-right">
                      {match.awayTeamStats?.possession}%
                    </div>
                  </div>
                  <div className="text-center text-xs text-gray-500">Possession</div>

                  {/* Shots */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-600 w-20">
                      {match.homeTeamStats?.shots}
                    </div>
                    <div className="flex-1 mx-4 text-center text-sm text-gray-600">
                      Shots
                    </div>
                    <div className="text-sm font-medium text-gray-600 w-20 text-right">
                      {match.awayTeamStats?.shots}
                    </div>
                  </div>

                  {/* Shots on Target */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-600 w-20">
                      {match.homeTeamStats?.shotsOnTarget}
                    </div>
                    <div className="flex-1 mx-4 text-center text-sm text-gray-600">
                      Shots on Target
                    </div>
                    <div className="text-sm font-medium text-gray-600 w-20 text-right">
                      {match.awayTeamStats?.shotsOnTarget}
                    </div>
                  </div>

                  {/* Corners */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-600 w-20">
                      {match.homeTeamStats?.corners}
                    </div>
                    <div className="flex-1 mx-4 text-center text-sm text-gray-600">
                      Corners
                    </div>
                    <div className="text-sm font-medium text-gray-600 w-20 text-right">
                      {match.awayTeamStats?.corners}
                    </div>
                  </div>

                  {/* Fouls */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-600 w-20">
                      {match.homeTeamStats?.fouls}
                    </div>
                    <div className="flex-1 mx-4 text-center text-sm text-gray-600">
                      Fouls
                    </div>
                    <div className="text-sm font-medium text-gray-600 w-20 text-right">
                      {match.awayTeamStats?.fouls}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confidence Score */}
          {match.confidence && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Prediction Confidence</h3>
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span className="text-lg font-bold text-blue-600">{match.confidence}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      match.confidence >= 80 ? 'bg-green-500' : 
                      match.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${match.confidence}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button>
              <TrendingUp className="w-4 h-4 mr-2" />
              View Predictions
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 