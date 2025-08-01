'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export default function TestAPIPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [espnData, setEspnData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testAPIs = async () => {
      try {
        setLoading(true);
        setError(null);

        // Test health endpoint
        const health = await apiClient.getHealth();
        setHealthData(health);

        // Test ESPN endpoint
        const espn = await apiClient.getESPNScoreboard('eng.1');
        setEspnData(espn);

      } catch (err) {
        console.error('API Test Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    testAPIs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Testing API connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Test Results</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health Check */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Health Check</h2>
            {healthData ? (
              <div className="space-y-2">
                <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-sm ${healthData.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{healthData.status}</span></p>
                <p><strong>Uptime:</strong> {Math.round(healthData.uptime)}s</p>
                <p><strong>Timestamp:</strong> {new Date(healthData.timestamp).toLocaleString()}</p>
                {healthData.services && (
                  <div>
                    <p><strong>Services:</strong></p>
                    <ul className="ml-4 space-y-1">
                      {Object.entries(healthData.services).map(([service, status]: [string, any]) => (
                        <li key={service} className="text-sm">
                          {service}: <span className={`px-1 py-0.5 rounded text-xs ${status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{status}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No health data available</p>
            )}
          </div>

          {/* ESPN Data */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">ESPN Premier League Data</h2>
            {espnData ? (
              <div className="space-y-2">
                <p><strong>Success:</strong> <span className={`px-2 py-1 rounded text-sm ${espnData.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{espnData.success ? 'Yes' : 'No'}</span></p>
                <p><strong>Events Count:</strong> {espnData.data?.events?.length || 0}</p>
                <p><strong>Timestamp:</strong> {new Date(espnData.timestamp).toLocaleString()}</p>
                
                {espnData.data?.events && espnData.data.events.length > 0 && (
                  <div>
                    <p><strong>Sample Event:</strong></p>
                    <div className="bg-gray-50 rounded p-3 text-sm">
                      <p><strong>Name:</strong> {espnData.data.events[0].name}</p>
                      <p><strong>Date:</strong> {new Date(espnData.data.events[0].date).toLocaleString()}</p>
                      <p><strong>Status:</strong> {espnData.data.events[0].status?.type?.description || 'Unknown'}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No ESPN data available</p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <a 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
} 