'use client';

import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { HealthStatus } from '@/components/ui/health-status';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of your football prediction system
          </p>
        </div>
        <HealthStatus />
      </div>
      <DashboardContent />
    </div>
  );
} 