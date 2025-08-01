'use client';

import { LiveMatchesDashboard } from '@/components/dashboard/live-matches-dashboard';
import { StandingsDashboard } from '@/components/dashboard/standings-dashboard';
import { EnhancedNavigation } from '@/components/home/enhanced-navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LiveDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <EnhancedNavigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Live Football Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Real-time match updates, live scores, and current standings from major leagues
          </p>
        </div>

        <Tabs defaultValue="live-matches" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="live-matches">Live Matches</TabsTrigger>
            <TabsTrigger value="standings">League Standings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="live-matches" className="mt-6">
            <LiveMatchesDashboard />
          </TabsContent>
          
          <TabsContent value="standings" className="mt-6">
            <StandingsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 