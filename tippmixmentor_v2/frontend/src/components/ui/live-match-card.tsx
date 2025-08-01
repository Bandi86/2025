import { Card, CardContent, CardHeader } from './card'
import { Badge } from './badge'
import { Clock, Target, TrendingUp } from 'lucide-react'

interface LiveMatchCardProps {
  id?: string
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  minute?: number
  status: 'live' | 'finished' | 'scheduled'
  confidence?: number
  league?: string
  onClick?: () => void
  className?: string
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
  className = ''
}: LiveMatchCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-500'
      case 'finished': return 'bg-gray-500'
      default: return 'bg-blue-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'LIVE'
      case 'finished': return 'FT'
      default: return 'SCHEDULED'
    }
  }

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'live': return 'border-l-green-500'
      case 'finished': return 'border-l-gray-500'
      default: return 'border-l-blue-500'
    }
  }

  const getBackgroundGradient = (status: string) => {
    switch (status) {
      case 'live': return 'bg-gradient-to-r from-green-50 to-white'
      case 'finished': return 'bg-gradient-to-r from-gray-50 to-white'
      default: return 'bg-gradient-to-r from-blue-50 to-white'
    }
  }

  return (
    <Card 
      className={`border-l-4 ${getBorderColor(status)} ${getBackgroundGradient(status)} hover:shadow-md transition-shadow duration-200 cursor-pointer ${className}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <Badge variant="secondary" className={getStatusColor(status)}>
            {getStatusText(status)}
          </Badge>
          {confidence && (
            <div className="flex items-center text-sm text-gray-600">
              <Target className="w-4 h-4 mr-1" />
              {confidence}%
            </div>
          )}
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
      </CardContent>
    </Card>
  )
} 