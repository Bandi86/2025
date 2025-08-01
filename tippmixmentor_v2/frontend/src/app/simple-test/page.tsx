'use client';

import { useState, useEffect } from 'react';
import { DashboardDataService } from '@/lib/api/dashboard-data';

export default function SimpleTestPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string>('Starting...');

  useEffect(() => {
    const testDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        setStep('Testing live matches...');
        const liveMatches = await DashboardDataService.getLiveMatches();
        console.log('Live matches:', liveMatches);
        
        setStep('Testing predictions...');
        const predictions = await DashboardDataService.getRecentPredictions();
        console.log('Predictions:', predictions);
        
        setStep('Testing stats...');
        const stats = await DashboardDataService.getDashboardStats();
        console.log('Stats:', stats);
        
        setStep('Testing agents...');
        const agents = await DashboardDataService.getAgentStatus();
        console.log('Agents:', agents);
        
        setStep('Getting all data...');
        const allData = await DashboardDataService.getAllDashboardData();
        console.log('All data:', allData);
        
        setData(allData);
        setStep('Complete!');
        
      } catch (err) {
        console.error('Dashboard data error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStep('Error occurred');
      } finally {
        setLoading(false);
      }
    };

    testDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Data Test</h1>
        
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Current Step</h2>
            <p className="text-blue-700">{step}</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Matches ({data.liveMatches?.length || 0})</h2>
              {data.liveMatches && data.liveMatches.length > 0 ? (
                <div className="space-y-2">
                  {data.liveMatches.slice(0, 3).map((match: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <p><strong>{match.homeTeam}</strong> vs <strong>{match.awayTeam}</strong></p>
                      <p className="text-sm text-gray-600">Status: {match.status} | League: {match.league}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No live matches available</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Predictions ({data.predictions?.length || 0})</h2>
              {data.predictions && data.predictions.length > 0 ? (
                <div className="space-y-2">
                  {data.predictions.slice(0, 3).map((pred: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <p><strong>{pred.homeTeam}</strong> vs <strong>{pred.awayTeam}</strong></p>
                      <p className="text-sm text-gray-600">Prediction: {pred.prediction} | Confidence: {pred.confidence}%</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No predictions available</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Stats ({data.stats?.length || 0})</h2>
              {data.stats && data.stats.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {data.stats.map((stat: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <p className="font-semibold">{stat.title}</p>
                      <p className="text-2xl font-bold text-blue-600">{stat.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No stats available</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Agents ({data.agents?.length || 0})</h2>
              {data.agents && data.agents.length > 0 ? (
                <div className="space-y-2">
                  {data.agents.slice(0, 3).map((agent: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <p className="font-semibold">{agent.name}</p>
                      <p className="text-sm text-gray-600">Status: {agent.status} | Accuracy: {agent.accuracy}%</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No agents available</p>
              )}
            </div>
          </div>
        )}

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