import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Badge } from './badge';
import { Check, ArrowRight } from 'lucide-react';

interface League {
  id: string;
  name: string;
  country: string;
  isSelected: boolean;
}

interface Market {
  id: string;
  name: string;
  description: string;
  isSelected: boolean;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (preferences: { leagues: string[], markets: string[] }) => void;
}

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [leagues, setLeagues] = useState<League[]>([
    { id: '1', name: 'Premier League', country: 'England', isSelected: false },
    { id: '2', name: 'La Liga', country: 'Spain', isSelected: false },
    { id: '3', name: 'Bundesliga', country: 'Germany', isSelected: false },
    { id: '4', name: 'Serie A', country: 'Italy', isSelected: false },
    { id: '5', name: 'Ligue 1', country: 'France', isSelected: false },
    { id: '6', name: 'Champions League', country: 'Europe', isSelected: false },
    { id: '7', name: 'Europa League', country: 'Europe', isSelected: false },
    { id: '8', name: 'Eredivisie', country: 'Netherlands', isSelected: false },
    { id: '9', name: 'Primeira Liga', country: 'Portugal', isSelected: false },
    { id: '10', name: 'Scottish Premiership', country: 'Scotland', isSelected: false },
  ]);

  const [markets, setMarkets] = useState<Market[]>([
    { id: '1', name: 'Match Winner', description: 'Home win, Away win, or Draw', isSelected: false },
    { id: '2', name: 'Over/Under', description: 'Total goals scored in the match', isSelected: false },
    { id: '3', name: 'Both Teams to Score', description: 'Will both teams score?', isSelected: false },
    { id: '4', name: 'Double Chance', description: 'Two possible outcomes', isSelected: false },
    { id: '5', name: 'Correct Score', description: 'Exact final score prediction', isSelected: false },
    { id: '6', name: 'First Goalscorer', description: 'Who will score first?', isSelected: false },
  ]);

  // Load saved preferences
  useEffect(() => {
    try {
      const savedLeagues = localStorage.getItem('tmx_user_leagues');
      const savedMarkets = localStorage.getItem('tmx_user_markets');
      
      if (savedLeagues) {
        const selectedLeagueIds = JSON.parse(savedLeagues);
        setLeagues(prev => prev.map(league => ({
          ...league,
          isSelected: selectedLeagueIds.includes(league.id)
        })));
      }
      
      if (savedMarkets) {
        const selectedMarketIds = JSON.parse(savedMarkets);
        setMarkets(prev => prev.map(market => ({
          ...market,
          isSelected: selectedMarketIds.includes(market.id)
        })));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleLeague = (id: string) => {
    setLeagues(prev => prev.map(league => 
      league.id === id ? { ...league, isSelected: !league.isSelected } : league
    ));
  };

  const toggleMarket = (id: string) => {
    setMarkets(prev => prev.map(market => 
      market.id === id ? { ...market, isSelected: !market.isSelected } : market
    ));
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save preferences
      const selectedLeagues = leagues.filter(l => l.isSelected).map(l => l.id);
      const selectedMarkets = markets.filter(m => m.isSelected).map(m => m.id);
      
      localStorage.setItem('tmx_user_leagues', JSON.stringify(selectedLeagues));
      localStorage.setItem('tmx_user_markets', JSON.stringify(selectedMarkets));
      
      onComplete({
        leagues: selectedLeagues,
        markets: selectedMarkets
      });
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const selectedLeaguesCount = leagues.filter(l => l.isSelected).length;
  const selectedMarketsCount = markets.filter(m => m.isSelected).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {step === 1 && 'Welcome to TippMixMentor!'}
            {step === 2 && 'Choose Your Leagues'}
            {step === 3 && 'Select Your Markets'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <ArrowRight className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Let's personalize your experience
                </h3>
                <p className="text-gray-600">
                  We'll help you set up your preferences for leagues and betting markets to show you the most relevant predictions.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Leagues */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Select your favorite leagues ({selectedLeaguesCount} selected)
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Choose the leagues you want to follow for predictions and live updates.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {leagues.map((league) => (
                  <div
                    key={league.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      league.isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleLeague(league.id)}
                  >
                    <div>
                      <div className="font-medium text-gray-900">{league.name}</div>
                      <div className="text-sm text-gray-500">{league.country}</div>
                    </div>
                    {league.isSelected && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Markets */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Choose your betting markets ({selectedMarketsCount} selected)
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Select the types of predictions you're most interested in.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {markets.map((market) => (
                  <div
                    key={market.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      market.isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleMarket(market.id)}
                  >
                    <div>
                      <div className="font-medium text-gray-900">{market.name}</div>
                      <div className="text-sm text-gray-500">{market.description}</div>
                    </div>
                    {market.isSelected && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={handleSkip}>
              Skip for now
            </Button>
            <Button onClick={handleNext}>
              {step === 3 ? 'Complete Setup' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 