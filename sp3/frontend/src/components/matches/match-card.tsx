import { Badge } from "@/components/ui/badge";
import { Clock, Star } from "lucide-react";
import { Match, MatchStatus, Market } from "@/types/match";
import {
  formatTime,
  capitalizeTeamName,
  getTeamLogo,
  getMatchCardBg,
  getMatchCardBorder
} from "@/utils/match-helpers";
import { OddsDisplay } from "./odds-display";

interface MatchCardProps {
  match: Match;
  matchStatus: MatchStatus;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function MatchCard({
  match,
  matchStatus,
  isExpanded,
  onToggleExpand
}: MatchCardProps) {
  console.log(`Debug: MatchCard rendering with match.date=${match.date}, match.timeZone=${match.timeZone}`);
  const formattedTime = formatTime(match.date, match.timeZone || 'Europe/Budapest');

  const mainMarket = match.markets?.find(m =>
    m.name.toLowerCase() === "fő piac" ||
    m.name.toLowerCase() === "main" ||
    m.name.toLowerCase() === "1x2"
  ) || match.markets?.[0];

  const otherMarkets = match.markets?.filter(m => m.id !== mainMarket?.id) || [];

  return (
    <div className={`rounded-lg border transition-all duration-200 ${getMatchCardBg(matchStatus)} ${getMatchCardBorder(matchStatus)}`}>
      <div className="px-4 py-3">
        {/* Single row layout: Time + Competition | Teams | Odds + Markets */}
        <div className="flex items-center gap-4">
          {/* Time & Competition */}
          <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="font-mono text-sm font-bold text-white tracking-wider">
                {formattedTime}
              </span>
            </div>
            <MatchStatusBadge matchStatus={matchStatus} match={match} />
          </div>

          {/* Teams */}
          <div className="flex-1 min-w-0">
            <TeamDisplayCompact match={match} />
          </div>

          {/* Odds */}
          <OddsDisplay
            market={mainMarket}
            onExpand={otherMarkets.length > 0 ? onToggleExpand : undefined}
            additionalMarketsCount={otherMarkets.length}
            isExpanded={isExpanded}
          />
        </div>
      </div>

      {/* Expanded Markets */}
      {isExpanded && otherMarkets.length > 0 && (
        <ExpandedMarkets markets={otherMarkets} />
      )}
    </div>
  );
}

interface MatchStatusBadgeProps {
  matchStatus: MatchStatus;
  match: Match;
}

function MatchStatusBadge({ matchStatus, match }: MatchStatusBadgeProps) {
  if (matchStatus.type === 'live') {
    return (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse text-xs px-2 py-0.5">
        {matchStatus.label}
      </Badge>
    );
  }

  if (matchStatus.type === 'soon') {
    return (
      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs px-2 py-0.5">
        {matchStatus.label}
      </Badge>
    );
  }

  if (matchStatus.type === 'finished') {
    return (
      <Badge variant="secondary" className="bg-slate-700 text-white text-xs px-2 py-0.5">
        {match.homeScore} - {match.awayScore}
      </Badge>
    );
  }

  return null;
}

interface TeamDisplayProps {
  match: Match;
}

function TeamDisplayCompact({ match }: TeamDisplayProps) {
  return (
    <div className="flex items-center gap-3 text-white">
      <div className="flex items-center gap-2">
        <img
          src={getTeamLogo()}
          alt="logo"
          className="w-4 h-4 rounded border border-slate-600 flex-shrink-0"
        />
        <span className="font-medium text-sm truncate">
          {capitalizeTeamName(match.homeTeam.name)}
        </span>
      </div>

      <span className="text-slate-400 font-bold text-sm px-1 flex-shrink-0">-</span>

      <div className="flex items-center gap-2">
        <img
          src={getTeamLogo()}
          alt="logo"
          className="w-4 h-4 rounded border border-slate-600 flex-shrink-0"
        />
        <span className="font-medium text-sm truncate">
          {capitalizeTeamName(match.awayTeam.name)}
        </span>
      </div>
    </div>
  );
}

interface ExpandedMarketsProps {
  markets: Market[];
}

function ExpandedMarkets({ markets }: ExpandedMarketsProps) {
  return (
    <div className="px-4 pb-4 bg-slate-700/10 border-t border-slate-700/20">
      <div className="mt-3">
        <h4 className="text-slate-300 font-medium mb-2 flex items-center gap-2 text-sm">
          <Star className="h-3.5 w-3.5" />
          További piacok
        </h4>
        <div className="space-y-2">
          {markets.map((market) => (
            <div key={market.id} className="bg-slate-800/40 rounded-md p-3 border border-slate-700/20">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium text-sm">{market.name}</span>
                <div className="flex gap-1.5">
                  <button className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    market.odds1
                      ? 'bg-green-600/70 hover:bg-green-600 text-white'
                      : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  }`}>
                    {market.odds1 || '-'}
                  </button>
                  {market.oddsX && (
                    <button className="px-2.5 py-1 rounded text-xs font-bold bg-yellow-600/70 hover:bg-yellow-600 text-white transition-all">
                      {market.oddsX}
                    </button>
                  )}
                  <button className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    market.odds2
                      ? 'bg-blue-600/70 hover:bg-blue-600 text-white'
                      : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  }`}>
                    {market.odds2 || '-'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
