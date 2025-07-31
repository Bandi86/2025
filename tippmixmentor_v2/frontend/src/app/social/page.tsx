'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { SocialFeed } from '@/components/social/social-feed';
import { MessageSquare, Users, TrendingUp } from 'lucide-react';

export default function SocialPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Social Feed</h1>
              <p className="text-gray-600 mt-1">
                Connect with other football prediction enthusiasts and share insights
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>342 active users</span>
              </div>
            </div>
          </div>

          {/* Social Feed */}
          <SocialFeed />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 