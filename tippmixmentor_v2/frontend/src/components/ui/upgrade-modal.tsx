import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Badge } from './badge';
import { Crown, Check, Star, Zap, Target, Clock } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: 'high_confidence' | 'why_details' | 'pro_filters' | 'manual';
}

export function UpgradeModal({ isOpen, onClose, trigger = 'manual' }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const getTriggerMessage = () => {
    switch (trigger) {
      case 'high_confidence':
        return 'Unlock our highest-confidence predictions and real-time insights';
      case 'why_details':
        return 'See exactly why we\'re confident about this prediction';
      case 'pro_filters':
        return 'Access advanced filtering and analysis tools';
      default:
        return 'Upgrade to Pro for advanced features and insights';
    }
  };

  const plans = {
    monthly: {
      price: 29,
      period: 'month',
      savings: null
    },
    yearly: {
      price: 290,
      period: 'year',
      savings: 'Save 17%'
    }
  };

  const features = [
    {
      icon: Target,
      title: 'High-Confidence Signals',
      description: 'Access our most accurate predictions with detailed reasoning'
    },
    {
      icon: Zap,
      title: 'Real-Time Insights',
      description: 'Live data updates and instant notifications'
    },
    {
      icon: Star,
      title: 'Advanced Filters',
      description: 'Pro filters for momentum, value bets, and comeback potential'
    },
    {
      icon: Clock,
      title: 'Instant Access',
      description: 'No delays on live data and predictions'
    },
    {
      icon: Crown,
      title: 'Priority Support',
      description: 'Direct access to our expert team'
    }
  ];

  const handleUpgrade = () => {
    // TODO: Implement actual upgrade flow
    console.log('Upgrading to Pro...');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            Upgrade to Pro
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Trigger Message */}
          <div className="text-center">
            <p className="text-gray-600">{getTriggerMessage()}</p>
          </div>

          {/* Plan Selection */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant={selectedPlan === 'monthly' ? 'default' : 'outline'}
                onClick={() => setSelectedPlan('monthly')}
                className="flex-1"
              >
                Monthly
              </Button>
              <Button
                variant={selectedPlan === 'yearly' ? 'default' : 'outline'}
                onClick={() => setSelectedPlan('yearly')}
                className="flex-1"
              >
                Yearly
                {plans.yearly.savings && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {plans.yearly.savings}
                  </Badge>
                )}
              </Button>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                €{plans[selectedPlan].price}
              </div>
              <div className="text-gray-500">
                per {plans[selectedPlan].period}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Pro Features</h3>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{feature.title}</div>
                    <div className="text-sm text-gray-600">{feature.description}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Button onClick={handleUpgrade} className="w-full" size="lg">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full">
              Maybe Later
            </Button>
          </div>

          {/* Trial Info */}
          <div className="text-center text-sm text-gray-500">
            <p>7-day free trial • Cancel anytime</p>
            <p>Already have an account? <button className="text-blue-600 hover:underline">Sign in</button></p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 