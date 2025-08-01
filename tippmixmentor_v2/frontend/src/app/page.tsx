'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Target,
  BarChart3,
  Users,
  Zap,
  Shield,
  ArrowRight,
  Play,
  Crown,
  Clock,
} from 'lucide-react';
import { EnhancedNavigation } from '@/components/home/enhanced-navigation';
import { LiveMatchCard } from '@/components/ui/live-match-card';
import { PredictionCard } from '@/components/ui/prediction-card';
import { StatCard } from '@/components/ui/stat-card';
import { RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { useMemo } from 'react';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useAuth } from '@/hooks/use-auth';
import { Roles } from '@/lib/auth/roles';

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-lg border bg-white shadow-sm p-6 animate-pulse ${className}`}>
      <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
      <div className="h-6 w-32 bg-gray-200 rounded" />
    </div>
  );
}

export default function HomePage() {
  const { data, loading, error, refresh } = useDashboardData();
  const { role, isAuthenticated, isProUser } = useAuth();

  const primaryCta = useMemo(() => {
    if (!isAuthenticated) {
      return (
        <Link href="/auth" aria-label="Sign in to start predicting">
          <Button size="lg" className="text-lg px-8 py-3">
            <Play className="w-5 h-5 mr-2" />
            Start Predicting
          </Button>
        </Link>
      );
    }
    return (
      <Link href="/dashboard" aria-label="Open your dashboard">
        <Button size="lg" className="text-lg px-8 py-3">
          <ArrowRight className="w-5 h-5 mr-2" />
          Go to Dashboard
        </Button>
      </Link>
    );
  }, [isAuthenticated]);

  const secondaryCta = useMemo(() => {
    if (!isAuthenticated) {
      return (
        <Link href="/dashboard" aria-label="View a demo of the dashboard">
          <Button size="lg" variant="outline" className="text-lg px-8 py-3">
            <ArrowRight className="w-5 h-5 mr-2" />
            View Demo
          </Button>
        </Link>
      );
    }
    // Authenticated quick link varies by role
    if (role === Roles.analyst || role === Roles.admin) {
      return (
        <Link href="/analytics" aria-label="Open analytics">
          <Button size="lg" variant="outline" className="text-lg px-8 py-3">
            <BarChart3 className="w-5 h-5 mr-2" />
            Open Analytics
          </Button>
        </Link>
      );
    }
    return (
      <Link href="/predictions" aria-label="Open predictions">
        <Button size="lg" variant="outline" className="text-lg px-8 py-3">
          <ArrowRight className="w-5 h-5 mr-2" />
          See Predictions
        </Button>
      </Link>
    );
  }, [isAuthenticated, role]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <EnhancedNavigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4" aria-label="AI and Machine Learning powered">
              <Zap className="w-4 h-4 mr-2" />
              Powered by AI & Machine Learning
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Football Predictions
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {' '}Made Simple
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A comprehensive football prediction system that combines modern web technologies
              with machine learning to provide accurate match predictions and betting insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {primaryCta}
              {secondaryCta}
            </div>
            {!isAuthenticated && (
              <p className="mt-4 text-sm text-gray-500" role="note">
                Demo data is shown below. Sign in to unlock full live data and ROI tracking.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Live Dashboard Preview */}
      <section className="py-16 bg-white" aria-labelledby="preview-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 id="preview-heading" className="text-3xl font-bold text-gray-900 mb-4">
              Live Dashboard Preview
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See our platform in action with real-time data and live predictions
            </p>
            {!isProUser && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-orange-600">
                <Crown className="w-4 h-4" />
                <span>Live data shown is demo. Sign in for your leagues and real-time updates.</span>
              </div>
            )}
          </div>

          {loading && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12" aria-busy="true">
                <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            </>
          )}

          {!loading && error && (
            <div className="text-center py-8 text-red-600" role="alert">
              <AlertCircle className="w-6 h-6 mx-auto mb-2" />
              <p className="mb-4">{error}</p>
              <Button onClick={refresh} variant="outline" className="mt-2" aria-label="Retry loading data" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Stats Grid */}
              <div className="mb-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Platform Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {data.stats?.length ? (
                    data.stats.map((stat, index) => (
                      <StatCard
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        change={stat.change}
                        changeType={stat.changeType}
                        icon={stat.icon}
                        color={stat.color}
                        format={stat.format}
                      />
                    ))
                  ) : (
                    <div className="col-span-4 text-center text-gray-500">
                      No statistics available
                    </div>
                  )}
                </div>
              </div>

              {/* Live Matches */}
              <div className="mb-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Live Matches ({data.liveMatches?.length || 0})
                </h3>
                {data.liveMatches?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.liveMatches.slice(0, 6).map((match, index) => (
                      <div key={match.id} className="relative">
                        <LiveMatchCard
                          homeTeam={match.homeTeam}
                          awayTeam={match.awayTeam}
                          homeScore={match.homeScore}
                          awayScore={match.awayScore}
                          minute={match.minute}
                          status={match.status}
                          confidence={match.confidence}
                          league={match.league}
                          isProUser={isProUser}
                          isHighConfidence={match.confidence ? match.confidence > 80 : false}
                        />
                        {/* Pro badge for high-confidence matches */}
                        {!isProUser && match.confidence && match.confidence > 80 && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                              <Crown className="w-3 h-3 mr-1" />
                              Pro: real-time
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No live matches available</p>
                  </div>
                )}
              </div>

              {/* Recent Predictions */}
              <div className="mb-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Recent Predictions ({data.predictions?.length || 0})
                </h3>
                {data.predictions?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.predictions.slice(0, 3).map((prediction) => (
                      <div key={prediction.id} className="relative">
                        <PredictionCard
                          homeTeam={prediction.homeTeam}
                          awayTeam={prediction.awayTeam}
                          prediction={prediction.prediction}
                          confidence={prediction.confidence}
                          odds={prediction.odds}
                          stake={prediction.stake}
                          potentialWin={prediction.potentialWin}
                          matchTime={prediction.matchTime}
                          league={prediction.league}
                          status={prediction.status}
                        />
                        {/* Pro badge for high-confidence predictions */}
                        {!isProUser && prediction.confidence && prediction.confidence > 75 && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                              <Crown className="w-3 h-3 mr-1" />
                              Pro: detailed
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No predictions available</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Pro Features Section */}
      {!isProUser && (
        <section className="py-16 bg-gradient-to-r from-yellow-50 to-orange-50" aria-labelledby="pro-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 id="pro-heading" className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
                <Crown className="w-8 h-8 text-yellow-600" />
                Unlock Pro Features
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Get access to our most accurate predictions, real-time insights, and advanced analytics
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">High-Confidence Signals</CardTitle>
                  <CardDescription>
                    Access our most accurate predictions with detailed reasoning
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Real-Time Insights</CardTitle>
                  <CardDescription>
                    Live data updates and instant notifications
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Advanced Filters</CardTitle>
                  <CardDescription>
                    Pro filters for momentum, value bets, and comeback potential
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">Instant Access</CardTitle>
                  <CardDescription>
                    No delays on live data and predictions
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
            <div className="text-center mt-8">
              <Link href="/auth" aria-label="Upgrade to Pro">
                <Button size="lg" className="text-lg px-8 py-3">
                  <Crown className="w-5 h-5 mr-2" />
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-24 bg-white" aria-labelledby="why-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="why-heading" className="text-4xl font-bold text-gray-900 mb-4">Why Choose TippMixMentor?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge technology with user-friendly design to deliver the most accurate football predictions.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Advanced Analytics</CardTitle>
                <CardDescription>
                  Leverage machine learning algorithms and statistical models for precise predictions
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Real-time Data</CardTitle>
                <CardDescription>
                  Access live match data, player statistics, and team performance metrics
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">Performance Tracking</CardTitle>
                <CardDescription>
                  Monitor your prediction accuracy and track your betting performance over time
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-2xl">Community Features</CardTitle>
                <CardDescription>
                  Join a community of football enthusiasts and share insights with fellow predictors
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-2xl">Secure & Reliable</CardTitle>
                <CardDescription>
                  Enterprise-grade security with 99.9% uptime and data protection
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle className="text-2xl">Instant Insights</CardTitle>
                <CardDescription>
                  Get instant predictions and insights with our lightning-fast processing
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Predicting?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already making better football predictions with our advanced AI-powered platform.
          </p>
          {!isAuthenticated ? (
            <Link href="/auth" aria-label="Get started now">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Get Started Now
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard" aria-label="Open your dashboard now">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Open Dashboard
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">TippMixMentor v2</span>
            </div>
            <p className="text-gray-400 mb-4">The future of football predictions is here</p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <a href="/privacy" className="hover:text-white">Privacy Policy</a>
              <a href="/terms" className="hover:text-white">Terms of Service</a>
              <a href="/contact" className="hover:text-white">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}