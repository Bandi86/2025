'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { HealthStatus } from '@/components/ui/health-status';
import { AgentInsights } from '@/components/predictions/agent-insights';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

function DashboardContent() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                TippMixMentor Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/agents"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Agent Management
              </Link>
              <Link
                href="/social"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Social Feed
              </Link>
              <span className="text-sm text-gray-700">
                Welcome, {user?.firstName || user?.username}!
              </span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Welcome Section */}
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to TippMixMentor v2
              </h2>
              <p className="text-gray-600 mb-4">
                Your football prediction dashboard is ready!
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">User Information</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Username:</strong> {user?.username}</p>
                  <p><strong>Role:</strong> {user?.role}</p>
                  {user?.firstName && <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* System Health Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                System Health & Performance
              </h3>
              <div className="text-sm text-gray-500">
                API Gateway Integration Demo
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HealthStatus 
                showMetrics={true} 
                autoRefresh={false}
                refreshInterval={30000}
              />
              <div className="space-y-4">
                <div className="bg-white rounded-lg border p-6">
                  <h4 className="font-medium text-gray-900 mb-3">API Gateway Features</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Health monitoring with retry logic</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Performance metrics tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Centralized error handling</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Request/response logging</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Authentication token management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Timeout and retry mechanisms</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <h4 className="font-medium text-blue-900 mb-2">What's New</h4>
                  <p className="text-sm text-blue-800">
                    This Health Status component demonstrates the enhanced API Gateway integration 
                    with real-time health monitoring, performance metrics, and comprehensive 
                    error handling. The API client now includes retry logic, timeout management, 
                    and detailed logging for better debugging and monitoring.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Agent Insights Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                AI Agent Insights
              </h3>
              <div className="text-sm text-gray-500">
                Real-time intelligent recommendations
              </div>
            </div>
            <AgentInsights />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
} 