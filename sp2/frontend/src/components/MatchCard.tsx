import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type Match, type BettingOption } from '@/lib/api';
import { Clock, FileText } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  getBetTypeBadgeVariant: (betType: string) => 'default' | 'secondary' | 'outline' | 'destructive';
  formatOdds: (odds?: number) => string;
}

const getBetTypeDisplay = (betType: string): string => {
  const typeMap: Record<string, string> = {
    main: '1X2',
    goal: 'Gól',
    corner: 'Szöglet',
    card: 'Sárga lap',
    halftime: 'Félidő',
  };
  return typeMap[betType] || betType;
};

export default function MatchCard({ match, getBetTypeBadgeVariant, formatOdds }: MatchCardProps) {
  // Csoportosítjuk a fogadási opciókat típus szerint
  const groupedBets = match.betting_options.reduce((acc, bet) => {
    if (!acc[bet.bet_type]) {
      acc[bet.bet_type] = [];
    }
    acc[bet.bet_type].push(bet);
    return acc;
  }, {} as Record<string, BettingOption[]>);

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">
              {match.team_home} vs {match.team_away}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {match.match_day} {match.match_time}
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />#{match.match_id}
              </div>
              {match.source_pdf && (
                <div className="text-xs">Forrás: {match.source_pdf.split('_')[0]}...</div>
              )}
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {Object.keys(groupedBets).length} típus
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {Object.entries(groupedBets).map(([betType, bets]) => (
            <div key={betType} className="border-l-4 border-l-blue-200 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={getBetTypeBadgeVariant(betType)} className="text-xs">
                  {getBetTypeDisplay(betType)}
                </Badge>
                <span className="text-sm text-muted-foreground">{bets.length} opció</span>
              </div>

              <div className="space-y-2">
                {bets.map((bet, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 border">
                    {bet.bet_description && (
                      <div className="text-sm font-medium mb-2">{bet.bet_description}</div>
                    )}

                    <div className="flex gap-3 text-sm">
                      {bet.odds_1 && (
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-muted-foreground">1</span>
                          <span className="font-mono font-semibold text-green-600">
                            {formatOdds(bet.odds_1)}
                          </span>
                        </div>
                      )}

                      {bet.odds_2 && (
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-muted-foreground">X</span>
                          <span className="font-mono font-semibold text-blue-600">
                            {formatOdds(bet.odds_2)}
                          </span>
                        </div>
                      )}

                      {bet.odds_3 && (
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-muted-foreground">2</span>
                          <span className="font-mono font-semibold text-red-600">
                            {formatOdds(bet.odds_3)}
                          </span>
                        </div>
                      )}
                    </div>

                    {bet.raw_line && (
                      <div className="text-xs text-muted-foreground mt-2 font-mono bg-gray-100 p-1 rounded">
                        {bet.raw_line}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
