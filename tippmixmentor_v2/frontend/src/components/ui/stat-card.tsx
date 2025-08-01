import { Card, CardContent, CardHeader } from './card'
import { TrendingUp, TrendingDown, Minus, Target, DollarSign, Users, Activity } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon?: 'trending' | 'target' | 'dollar' | 'users' | 'activity'
  format?: 'percentage' | 'currency' | 'number' | 'text'
  description?: string
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red'
}

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon = 'trending',
  format = 'text',
  description,
  color = 'blue'
}: StatCardProps) {
  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'trending': return <TrendingUp className="w-5 h-5" />
      case 'target': return <Target className="w-5 h-5" />
      case 'dollar': return <DollarSign className="w-5 h-5" />
      case 'users': return <Users className="w-5 h-5" />
      case 'activity': return <Activity className="w-5 h-5" />
      default: return <TrendingUp className="w-5 h-5" />
    }
  }

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'green': return 'text-green-600 bg-green-50 border-green-200'
      case 'orange': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'purple': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'red': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'decrease': return <TrendingDown className="w-4 h-4 text-red-600" />
      default: return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase': return 'text-green-600'
      case 'decrease': return 'text-red-600'
      default: return 'text-gray-500'
    }
  }

  const formatValue = (value: string | number, format: string) => {
    switch (format) {
      case 'percentage':
        return `${value}%`
      case 'currency':
        return `€${value}`
      case 'number':
        return value.toLocaleString()
      default:
        return value
    }
  }

  const getBorderColor = (color: string) => {
    switch (color) {
      case 'blue': return 'border-l-blue-500'
      case 'green': return 'border-l-green-500'
      case 'orange': return 'border-l-orange-500'
      case 'purple': return 'border-l-purple-500'
      case 'red': return 'border-l-red-500'
      default: return 'border-l-blue-500'
    }
  }

  const getBackgroundGradient = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-gradient-to-r from-blue-50 to-white'
      case 'green': return 'bg-gradient-to-r from-green-50 to-white'
      case 'orange': return 'bg-gradient-to-r from-orange-50 to-white'
      case 'purple': return 'bg-gradient-to-r from-purple-50 to-white'
      case 'red': return 'bg-gradient-to-r from-red-50 to-white'
      default: return 'bg-gradient-to-r from-blue-50 to-white'
    }
  }

  return (
    <Card className={`border-l-4 ${getBorderColor(color)} ${getBackgroundGradient(color)} hover:shadow-md transition-shadow duration-200`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(color)}`}>
            {getIcon(icon)}
          </div>
          {change !== undefined && (
            <div className={`flex items-center text-sm ${getChangeColor(changeType)}`}>
              {getChangeIcon(changeType)}
              <span className="ml-1 font-medium">
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <div className="text-2xl font-bold text-gray-900">
            {formatValue(value, format)}
          </div>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 