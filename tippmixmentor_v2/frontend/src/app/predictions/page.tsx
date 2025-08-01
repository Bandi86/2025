'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { PredictionDashboard } from '@/components/predictions/prediction-dashboard';
import { PredictionForm } from '@/components/predictions/prediction-form';
import { PredictionInsights } from '@/components/predictions/prediction-insights';
import { BettingRecommendationsDashboard } from '@/components/predictions/betting-recommendations-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, BarChart3, Plus, Zap } from 'lucide-react';

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
            <TabsList className="grid w-full grid-cols-4">
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
              <TabsTrigger value="betting" className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Betting Analysis</span>
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
                  <PredictionForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <PredictionInsights />
            </TabsContent>

            <TabsContent value="betting" className="space-y-6">
              <BettingRecommendationsDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 