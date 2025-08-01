import { Card, CardContent, CardHeader } from './card'
import { Badge } from './badge'
import { Brain, Activity, Target, Zap, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface AgentStatusProps {
  name: string
  type: 'prediction' | 'analysis' | 'monitoring' | 'insight'
  status: 'online' | 'offline' | 'busy' | 'error'
  accuracy: number
  predictionsMade: number
  lastActivity: string
  performance?: {
    successRate: number
    avgResponseTime: number
    uptime: number
  }
  currentTask?: string
}

export function AgentStatus({
  name,
  type,
  status,
  accuracy,
  predictionsMade,
  lastActivity,
  performance,
  currentTask
}: AgentStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-50 border-green-200'
      case 'offline': return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'busy': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4" />
      case 'offline': return <Clock className="w-4 h-4" />
      case 'busy': return <Activity className="w-4 h-4" />
      case 'error': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'prediction': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'analysis': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'monitoring': return 'text-green-600 bg-green-50 border-green-200'
      case 'insight': return 'text-orange-600 bg-orange-50 border-orange-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'prediction': return <Target className="w-4 h-4" />
      case 'analysis': return <Brain className="w-4 h-4" />
      case 'monitoring': return <Activity className="w-4 h-4" />
      case 'insight': return <Zap className="w-4 h-4" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600'
    if (accuracy >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'online': return 'border-l-green-500'
      case 'offline': return 'border-l-gray-500'
      case 'busy': return 'border-l-yellow-500'
      case 'error': return 'border-l-red-500'
      default: return 'border-l-gray-500'
    }
  }

  const getBackgroundGradient = (status: string) => {
    switch (status) {
      case 'online': return 'bg-gradient-to-r from-green-50 to-white'
      case 'offline': return 'bg-gradient-to-r from-gray-50 to-white'
      case 'busy': return 'bg-gradient-to-r from-yellow-50 to-white'
      case 'error': return 'bg-gradient-to-r from-red-50 to-white'
      default: return 'bg-gradient-to-r from-gray-50 to-white'
    }
  }

  return (
    <Card className={`border-l-4 ${getBorderColor(status)} ${getBackgroundGradient(status)} hover:shadow-md transition-shadow duration-200`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className={getTypeColor(type)}>
              <div className="flex items-center space-x-1">
                {getTypeIcon(type)}
                <span className="text-xs">{type.toUpperCase()}</span>
              </div>
            </Badge>
            <Badge variant="secondary" className={getStatusColor(status)}>
              <div className="flex items-center space-x-1">
                {getStatusIcon(status)}
                <span className="text-xs">{status.toUpperCase()}</span>
              </div>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Agent Name */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          </div>

          {/* Current Task */}
          {currentTask && (
            <div className="text-center">
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                <span className="font-medium">Current:</span> {currentTask}
              </p>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className={`text-lg font-bold ${getAccuracyColor(accuracy)}`}>
                {accuracy}%
              </div>
              <div className="text-xs text-gray-500">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {predictionsMade.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Predictions</div>
            </div>
          </div>

          {/* Performance Metrics */}
          {performance && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Success Rate:</span>
                <span className="font-medium">{performance.successRate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg Response:</span>
                <span className="font-medium">{performance.avgResponseTime}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uptime:</span>
                <span className="font-medium">{performance.uptime}%</span>
              </div>
            </div>
          )}

          {/* Last Activity */}
          <div className="text-center pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Last activity: {lastActivity}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 