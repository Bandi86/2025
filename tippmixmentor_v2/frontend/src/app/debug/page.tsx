'use client';

import { useState } from 'react';

export default function DebugPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testAPI = async (endpoint: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1${endpoint}`);
      const data = await response.json();
      setResults(prev => ({ ...prev, [endpoint]: { success: true, data, status: response.status } }));
    } catch (error) {
      setResults(prev => ({ ...prev, [endpoint]: { success: false, error: error instanceof Error ? error.message : 'Unknown error' } }));
    } finally {
      setLoading(false);
    }
  };

  const testAll = async () => {
    setLoading(true);
    setResults({});
    
    await Promise.all([
      testAPI('/health'),
      testAPI('/espn-football/scoreboard/eng.1'),
      testAPI('/espn-football/live-matches')
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Debug Page</h1>
        
        <div className="mb-6">
          <button 
            onClick={testAll}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test All APIs'}
          </button>
        </div>

        <div className="space-y-4">
          {Object.entries(results).map(([endpoint, result]: [string, any]) => (
            <div key={endpoint} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{endpoint}</h3>
              {result.success ? (
                <div>
                  <p className="text-green-600 mb-2">✅ Success (Status: {result.status})</p>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-64">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div>
                  <p className="text-red-600 mb-2">❌ Error</p>
                  <p className="text-red-700">{result.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8">
          <a 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
} 