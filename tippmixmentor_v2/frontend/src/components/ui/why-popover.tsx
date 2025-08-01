import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { Badge } from './badge';
import { Info, TrendingUp, TrendingDown, Target, Clock } from 'lucide-react';

interface WhyDriver {
  name: string;
  value: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

interface WhyPopoverProps {
  confidence: number;
  drivers: WhyDriver[];
  trendData?: number[]; // Last 10-20 minutes trend data
  isProUser?: boolean;
  children?: React.ReactNode;
}

export function WhyPopover({ 
  confidence, 
  drivers, 
  trendData, 
  isProUser = false,
  children 
}: WhyPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="w-4 h-4" />;
      case 'negative': return <TrendingDown className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  // Mock trend data if not provided
  const displayTrendData = trendData || Array.from({ length: 10 }, () => 
    Math.random() * 100
  );

  if (!isProUser) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {children || (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Info className="w-4 h-4" />
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Why this confidence?</h4>
              <Badge variant="outline" className="text-xs">
                PRO Feature
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              <p>Unlock detailed insights into our confidence calculations.</p>
              <p className="mt-2 font-medium">Upgrade to Pro to see:</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>• Key performance drivers</li>
                <li>• Real-time trend analysis</li>
                <li>• Historical accuracy data</li>
              </ul>
            </div>
            <Button size="sm" className="w-full">
              Upgrade to Pro
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Info className="w-4 h-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Confidence Drivers</h4>
            <Badge variant="secondary" className="text-xs">
              {confidence}%
            </Badge>
          </div>

          {/* Top Drivers */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-700">Key Factors</h5>
            {drivers.slice(0, 3).map((driver, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-md bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className={getImpactColor(driver.impact)}>
                    {getImpactIcon(driver.impact)}
                  </div>
                  <span className="text-sm font-medium">{driver.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{driver.value}</div>
                  <div className="text-xs text-gray-500">{driver.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Trend Sparkline */}
          {displayTrendData.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">Recent Trend</h5>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-8 bg-gray-100 rounded flex items-end justify-between px-1">
                  {displayTrendData.map((value, index) => (
                    <div
                      key={index}
                      className="bg-blue-500 rounded-t"
                      style={{
                        width: `${100 / displayTrendData.length}%`,
                        height: `${value}%`,
                        minHeight: '2px'
                      }}
                    />
                  ))}
                </div>
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500">
                Last {displayTrendData.length} minutes
              </p>
            </div>
          )}

          <div className="text-xs text-gray-500 pt-2 border-t">
            Based on real-time data and historical patterns
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 