'use client';

import { InteractiveLiveDashboard } from '@/components/dashboard/interactive-live-dashboard'
import { EnhancedNavigation } from '@/components/home/enhanced-navigation'
import { NotificationBell } from '@/components/ui/notification-bell'
import { SearchBar } from '@/components/ui/search-bar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  Target, 
  BarChart3, 
  Users, 
  Settings, 
  Bell,
  Search,
  Activity,
  Calendar,
  Star
} from 'lucide-react'

export default function DashboardPage() {
  // Mock notifications
  const notifications = [
    {
      id: '1',
      type: 'success' as const,
      title: 'Prediction Won!',
      message: 'Your prediction for Manchester City vs Arsenal was correct',
      timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
      read: false
    },
    {
      id: '2',
      type: 'info' as const,
      title: 'New Match Available',
      message: 'Real Madrid vs Barcelona predictions are now live',
      timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
      read: false
    },
    {
      id: '3',
      type: 'warning' as const,
      title: 'Low Confidence Alert',
      message: 'Prediction confidence for AC Milan vs Inter is below 60%',
      timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
      read: true
    }
  ]

  const handleNotificationClick = (notification: any) => {
    console.log('Notification clicked:', notification)
  }

  const handleSearch = (query: string) => {
    console.log('Search query:', query)
  }

  const handleResultSelect = (result: any) => {
    console.log('Search result selected:', result)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <EnhancedNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome back! Here's your football prediction overview.</p>
            </div>
            <div className="flex items-center space-x-3">
              <SearchBar
                placeholder="Search matches, teams, players..."
                onSearch={handleSearch}
                onResultSelect={handleResultSelect}
                className="w-64"
              />
              <NotificationBell
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
              />
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Predictions</p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900">78.5%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Winnings</p>
                    <p className="text-2xl font-bold text-gray-900">€1,247</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Streak</p>
                    <p className="text-2xl font-bold text-gray-900">5 days</p>
                  </div>
                  <Star className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Predictions</span>
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Matches</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <InteractiveLiveDashboard />
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Predictions dashboard coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Match Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Match schedule coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Analytics dashboard coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 