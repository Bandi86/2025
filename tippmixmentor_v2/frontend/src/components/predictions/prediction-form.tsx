'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Target, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const predictionSchema = z.object({
  matchId: z.string().min(1, 'Please select a match'),
  predictionType: z.enum(['MATCH_RESULT', 'OVER_UNDER', 'BOTH_TEAMS_SCORE']),
});

type PredictionFormData = z.infer<typeof predictionSchema>;

interface Match {
  id: string;
  homeTeam: {
    id: string;
    name: string;
  };
  awayTeam: {
    id: string;
    name: string;
  };
  matchDate: string;
  league: {
    name: string;
  };
}

interface PredictionFormProps {
  matches: Match[];
  onPredictionCreated?: (prediction: any) => void;
}

export function PredictionForm({ matches, onPredictionCreated }: PredictionFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PredictionFormData>({
    resolver: zodResolver(predictionSchema),
  });

  const selectedMatchId = watch('matchId');
  const selectedMatch = matches.find(match => match.id === selectedMatchId);

  const onSubmit = async (data: PredictionFormData) => {
    if (!user) {
      setError('You must be logged in to make predictions');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setPredictionResult(null);

    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create prediction');
      }

      const result = await response.json();
      setPredictionResult(result);
      onPredictionCreated?.(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Make a Prediction
          </CardTitle>
          <CardDescription>
            Select a match and prediction type to get AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Match</label>
              <select
                {...register('matchId')}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                <option value="">Choose a match...</option>
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {match.homeTeam.name} vs {match.awayTeam.name} - {match.league.name}
                  </option>
                ))}
              </select>
              {errors.matchId && (
                <p className="text-sm text-red-600">{errors.matchId.message}</p>
              )}
            </div>

            {selectedMatch && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-lg mb-2">
                  {selectedMatch.homeTeam.name} vs {selectedMatch.awayTeam.name}
                </h4>
                <p className="text-gray-600">
                  {new Date(selectedMatch.matchDate).toLocaleDateString()} - {selectedMatch.league.name}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Prediction Type</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex items-center space-x-2 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="MATCH_RESULT"
                    {...register('predictionType')}
                    className="text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Match Result</div>
                    <div className="text-sm text-gray-500">Home/Draw/Away</div>
                  </div>
                </label>

                <label className="flex items-center space-x-2 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="OVER_UNDER"
                    {...register('predictionType')}
                    className="text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Over/Under</div>
                    <div className="text-sm text-gray-500">Total Goals</div>
                  </div>
                </label>

                <label className="flex items-center space-x-2 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="BOTH_TEAMS_SCORE"
                    {...register('predictionType')}
                    className="text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Both Teams Score</div>
                    <div className="text-sm text-gray-500">Yes/No</div>
                  </div>
                </label>
              </div>
              {errors.predictionType && (
                <p className="text-sm text-red-600">{errors.predictionType.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !user}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Get Prediction
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {predictionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Prediction Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Match Result Prediction */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Match Result</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <div className="font-medium">Home Win</div>
                    <div className="text-blue-600">
                      {(predictionResult.homeWinProb * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Draw</div>
                    <div className="text-blue-600">
                      {(predictionResult.drawProb * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Away Win</div>
                    <div className="text-blue-600">
                      {(predictionResult.awayWinProb * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Predictions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Over/Under 2.5</h4>
                  <div className="text-lg font-bold text-green-600">
                    {predictionResult.overUnderPrediction?.prediction || 'N/A'}
                  </div>
                  <div className="text-sm text-green-700">
                    {(predictionResult.overUnderPrediction?.probability * 100).toFixed(1)}% confidence
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Both Teams Score</h4>
                  <div className="text-lg font-bold text-purple-600">
                    {predictionResult.bothTeamsScorePrediction?.prediction || 'N/A'}
                  </div>
                  <div className="text-sm text-purple-700">
                    {(predictionResult.bothTeamsScorePrediction?.probability * 100).toFixed(1)}% confidence
                  </div>
                </div>
              </div>

              {/* Insight */}
              {predictionResult.insight && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">AI Insight</h4>
                  <p className="text-yellow-800">{predictionResult.insight}</p>
                </div>
              )}

              {/* Betting Recommendations */}
              {predictionResult.bettingRecommendations && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">Betting Recommendations</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Risk Level:</span>
                      <span className="font-medium capitalize">
                        {predictionResult.bettingRecommendations.risk_level}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span className="font-medium capitalize">
                        {predictionResult.bettingRecommendations.confidence}
                      </span>
                    </div>
                    <p className="text-sm text-orange-700 mt-2">
                      {predictionResult.bettingRecommendations.explanation}
                    </p>
                  </div>
                </div>
              )}

              <div className="text-center text-sm text-gray-500">
                Prediction confidence: {(predictionResult.confidence * 100).toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 