'use client';

import { InteractiveLiveDashboard } from '@/components/dashboard/interactive-live-dashboard'
import { EnhancedNavigation } from '@/components/home/enhanced-navigation'

export default function InteractiveDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <EnhancedNavigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InteractiveLiveDashboard />
      </div>
    </div>
  )
} 