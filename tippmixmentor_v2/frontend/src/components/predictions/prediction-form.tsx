'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  Target, 
  Calendar,
  Users,
  Trophy,
  Zap,
  AlertCircle
} from 'lucide-react';

interface PredictionFormData {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  matchDate: string;
  homeTeamForm: string;
  awayTeamForm: string;
  homeTeamInjuries: string;
  awayTeamInjuries: string;
  weatherConditions: string;
  additionalFactors: string;
}

export function PredictionForm() {
  const [formData, setFormData] = React.useState<PredictionFormData>({
    homeTeam: '',
    awayTeam: '',
    competition: '',
    matchDate: '',
    homeTeamForm: '',
    awayTeamForm: '',
    homeTeamInjuries: '',
    awayTeamInjuries: '',
    weatherConditions: '',
    additionalFactors: ''
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [prediction, setPrediction] = React.useState<any>(null);

  const competitions = [
    'Premier League',
    'La Liga',
    'Bundesliga',
    'Serie A',
    'Ligue 1',
    'Champions League',
    'Europa League',
    'FA Cup',
    'Copa del Rey',
    'DFB Pokal'
  ];

  const formOptions = [
    'Excellent (5 wins in last 5)',
    'Very Good (4 wins in last 5)',
    'Good (3 wins in last 5)',
    'Average (2 wins in last 5)',
    'Poor (1 win in last 5)',
    'Very Poor (0 wins in last 5)'
  ];

  const weatherOptions = [
    'Clear/Sunny',
    'Cloudy',
    'Rainy',
    'Snowy',
    'Windy',
    'Hot (>25°C)',
    'Cold (<5°C)'
  ];

  const handleInputChange = (field: keyof PredictionFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const mockPrediction = {
        homeWin: Math.floor(Math.random() * 40) + 30,
        draw: Math.floor(Math.random() * 30) + 15,
        awayWin: Math.floor(Math.random() * 30) + 10,
        confidence: Math.floor(Math.random() * 30) + 60,
        recommendedBet: ['home', 'draw', 'away', 'none'][Math.floor(Math.random() * 4)],
        factors: [
          'Recent form analysis',
          'Head-to-head statistics',
          'Home/away performance',
          'Injury impact assessment',
          'Weather conditions'
        ]
      };

      // Normalize probabilities to sum to 100
      const total = mockPrediction.homeWin + mockPrediction.draw + mockPrediction.awayWin;
      mockPrediction.homeWin = Math.round((mockPrediction.homeWin / total) * 100);
      mockPrediction.draw = Math.round((mockPrediction.draw / total) * 100);
      mockPrediction.awayWin = 100 - mockPrediction.homeWin - mockPrediction.draw;

      setPrediction(mockPrediction);
      setIsLoading(false);
    }, 2000);
  };

  const getRecommendedBetColor = (bet: string) => {
    switch (bet) {
      case 'home': return 'bg-blue-100 text-blue-800';
      case 'draw': return 'bg-yellow-100 text-yellow-800';
      case 'away': return 'bg-purple-100 text-purple-800';
      case 'none': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Prediction</h1>
          <p className="text-gray-600 mt-1">
            Generate AI-powered match predictions with detailed analysis
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prediction Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>Match Information</span>
            </CardTitle>
            <CardDescription>
              Enter match details and team information for prediction analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Teams */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="homeTeam">Home Team</Label>
                  <Input
                    id="homeTeam"
                    value={formData.homeTeam}
                    onChange={(e) => handleInputChange('homeTeam', e.target.value)}
                    placeholder="e.g., Manchester City"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="awayTeam">Away Team</Label>
                  <Input
                    id="awayTeam"
                    value={formData.awayTeam}
                    onChange={(e) => handleInputChange('awayTeam', e.target.value)}
                    placeholder="e.g., Arsenal"
                    required
                  />
                </div>
              </div>

              {/* Competition and Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="competition">Competition</Label>
                  <Select value={formData.competition} onValueChange={(value) => handleInputChange('competition', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select competition" />
                    </SelectTrigger>
                    <SelectContent>
                      {competitions.map(competition => (
                        <SelectItem key={competition} value={competition}>
                          {competition}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="matchDate">Match Date</Label>
                  <Input
                    id="matchDate"
                    type="datetime-local"
                    value={formData.matchDate}
                    onChange={(e) => handleInputChange('matchDate', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Team Form */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="homeTeamForm">Home Team Form</Label>
                  <Select value={formData.homeTeamForm} onValueChange={(value) => handleInputChange('homeTeamForm', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select form" />
                    </SelectTrigger>
                    <SelectContent>
                      {formOptions.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="awayTeamForm">Away Team Form</Label>
                  <Select value={formData.awayTeamForm} onValueChange={(value) => handleInputChange('awayTeamForm', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select form" />
                    </SelectTrigger>
                    <SelectContent>
                      {formOptions.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Injuries */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="homeTeamInjuries">Home Team Injuries</Label>
                  <Textarea
                    id="homeTeamInjuries"
                    value={formData.homeTeamInjuries}
                    onChange={(e) => handleInputChange('homeTeamInjuries', e.target.value)}
                    placeholder="List key injured players..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="awayTeamInjuries">Away Team Injuries</Label>
                  <Textarea
                    id="awayTeamInjuries"
                    value={formData.awayTeamInjuries}
                    onChange={(e) => handleInputChange('awayTeamInjuries', e.target.value)}
                    placeholder="List key injured players..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Weather */}
              <div className="space-y-2">
                <Label htmlFor="weatherConditions">Weather Conditions</Label>
                <Select value={formData.weatherConditions} onValueChange={(value) => handleInputChange('weatherConditions', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select weather conditions" />
                  </SelectTrigger>
                  <SelectContent>
                    {weatherOptions.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Factors */}
              <div className="space-y-2">
                <Label htmlFor="additionalFactors">Additional Factors</Label>
                <Textarea
                  id="additionalFactors"
                  value={formData.additionalFactors}
                  onChange={(e) => handleInputChange('additionalFactors', e.target.value)}
                  placeholder="Any other relevant factors (motivation, rivalry, etc.)..."
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating Prediction...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Brain className="w-4 h-4" />
                    <span>Generate Prediction</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Prediction Results */}
        <div className="space-y-6">
          {prediction ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>AI Prediction Results</span>
                </CardTitle>
                <CardDescription>
                  Analysis based on provided match information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Match Info */}
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-lg">
                      {formData.homeTeam} vs {formData.awayTeam}
                    </h3>
                    <p className="text-sm text-gray-600">{formData.competition}</p>
                  </div>

                  {/* Prediction Probabilities */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Prediction Probabilities</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Home Win</span>
                          <span className="font-medium">{prediction.homeWin}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${prediction.homeWin}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Draw</span>
                          <span className="font-medium">{prediction.draw}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-600 h-2 rounded-full" 
                            style={{ width: `${prediction.draw}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Away Win</span>
                          <span className="font-medium">{prediction.awayWin}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${prediction.awayWin}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confidence and Recommendation */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{prediction.confidence}%</div>
                      <div className="text-sm text-blue-700">Confidence</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600 capitalize">
                        {prediction.recommendedBet}
                      </div>
                      <div className="text-sm text-green-700">Recommended</div>
                    </div>
                  </div>

                  {/* Analysis Factors */}
                  <div>
                    <h4 className="font-semibold mb-3">Analysis Factors</h4>
                    <div className="space-y-2">
                      {prediction.factors.map((factor: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>{factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" className="flex-1">
                      Save Prediction
                    </Button>
                    <Button className="flex-1">
                      View Detailed Analysis
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Prediction Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Prediction Yet</h3>
                  <p className="text-gray-600">
                    Fill out the form and generate your first AI prediction
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>Prediction Tips</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <span className="font-medium">Recent Form:</span> Consider last 5-10 matches for both teams
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <span className="font-medium">Head-to-Head:</span> Historical performance between teams
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <span className="font-medium">Injuries:</span> Key player absences can significantly impact outcomes
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <span className="font-medium">Motivation:</span> Consider team objectives and competition importance
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 