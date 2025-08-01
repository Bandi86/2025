import { Card, CardContent, CardHeader } from './card'
import { Badge } from './badge'
import { Target, TrendingUp, Clock, DollarSign, AlertTriangle } from 'lucide-react'

interface PredictionCardProps {
  homeTeam: string
  awayTeam: string
  prediction: 'HOME_WIN' | 'AWAY_WIN' | 'DRAW'
  confidence: number
  odds?: number
  stake?: number
  potentialWin?: number
  matchTime?: string
  league?: string
  status?: 'pending' | 'live' | 'won' | 'lost'
}

export function PredictionCard({
  homeTeam,
  awayTeam,
  prediction,
  confidence,
  odds,
  stake,
  potentialWin,
  matchTime,
  league,
  status = 'pending'
}: PredictionCardProps) {
  const getPredictionText = (prediction: string) => {
    switch (prediction) {
      case 'HOME_WIN': return `${homeTeam} Win`
      case 'AWAY_WIN': return `${awayTeam} Win`
      case 'DRAW': return 'Draw'
      default: return prediction
    }
  }

  const getPredictionColor = (prediction: string) => {
    switch (prediction) {
      case 'HOME_WIN': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'AWAY_WIN': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'DRAW': return 'text-orange-600 bg-orange-50 border-orange-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won': return 'text-green-600 bg-green-50 border-green-200'
      case 'lost': return 'text-red-600 bg-red-50 border-red-200'
      case 'live': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'won': return 'WON'
      case 'lost': return 'LOST'
      case 'live': return 'LIVE'
      default: return 'PENDING'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <Badge variant="secondary" className={getStatusColor(status)}>
            {getStatusText(status)}
          </Badge>
          <div className="flex items-center text-sm text-gray-600">
            <Target className="w-4 h-4 mr-1" />
            <span className={getConfidenceColor(confidence)}>{confidence}%</span>
          </div>
        </div>
        {league && (
          <p className="text-xs text-gray-500">{league}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Teams */}
          <div className="text-center">
            <div className="font-medium text-gray-900">{homeTeam}</div>
            <div className="text-sm text-gray-500">vs</div>
            <div className="font-medium text-gray-900">{awayTeam}</div>
          </div>

          {/* Prediction */}
          <div className="text-center">
            <Badge className={`${getPredictionColor(prediction)} font-medium`}>
              {getPredictionText(prediction)}
            </Badge>
          </div>

          {/* Match Time */}
          {matchTime && (
            <div className="flex items-center justify-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              {matchTime}
            </div>
          )}

          {/* Betting Info */}
          {(odds || stake || potentialWin) && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              {odds && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Odds:</span>
                  <span className="font-medium">{odds}</span>
                </div>
              )}
              {stake && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Stake:</span>
                  <span className="font-medium">€{stake}</span>
                </div>
              )}
              {potentialWin && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Potential Win:</span>
                  <span className="font-medium text-green-600">€{potentialWin}</span>
                </div>
              )}
            </div>
          )}

          {/* Confidence Indicator */}
          <div className="pt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Confidence</span>
              <span>{confidence}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  confidence >= 80 ? 'bg-green-500' : 
                  confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 