'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { PredictionDashboard } from '@/components/predictions/prediction-dashboard';
import { PredictionForm } from '@/components/predictions/prediction-form';
import { PredictionInsights } from '@/components/predictions/prediction-insights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, BarChart3, Plus } from 'lucide-react';

export default function PredictionsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Predictions</h1>
              <p className="text-gray-600 mt-1">
                Create and manage your football predictions with AI assistance
              </p>
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Create Prediction</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Insights</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <PredictionDashboard />
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Prediction</CardTitle>
                  <CardDescription>
                    Use our AI-powered prediction system to analyze matches and create accurate predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PredictionForm 
                    matches={[
                      {
                        id: '1',
                        homeTeam: { id: '1', name: 'Manchester United' },
                        awayTeam: { id: '2', name: 'Liverpool' },
                        matchDate: '2024-01-15T20:00:00Z',
                        league: { name: 'Premier League' }
                      },
                      {
                        id: '2',
                        homeTeam: { id: '3', name: 'Arsenal' },
                        awayTeam: { id: '4', name: 'Chelsea' },
                        matchDate: '2024-01-16T19:45:00Z',
                        league: { name: 'Premier League' }
                      }
                    ]}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <PredictionInsights 
                prediction={{
                  id: '1',
                  matchId: '1',
                  predictedScore: '2-1',
                  confidence: 85,
                  homeWinProb: 60,
                  drawProb: 25,
                  awayWinProb: 15
                }}
                matchData={{
                  homeTeam: { name: 'Manchester United', form: ['W', 'D', 'W', 'L', 'W'] },
                  awayTeam: { name: 'Liverpool', form: ['W', 'W', 'D', 'W', 'L'] },
                  headToHead: [
                    { date: '2023-12-01', homeScore: 2, awayScore: 1 },
                    { date: '2023-06-15', homeScore: 0, awayScore: 3 },
                    { date: '2023-01-20', homeScore: 1, awayScore: 1 }
                  ]
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 