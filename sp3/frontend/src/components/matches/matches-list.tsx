import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Match } from "@/types/match";
import { MatchCard } from "./match-card";
import { getMatchStatus, groupCompetitionsByCountry, formatCompetitionName } from "@/utils/match-helpers";
import { Trophy } from "lucide-react";
import { memo, useMemo } from "react";

interface MatchesListProps {
  groupedMatches: Record<string, Record<string, Match[]>>;
  expanded: Record<string, boolean>;
  onToggleExpand: (id: string) => void;
}

export const MatchesList = memo(function MatchesList({ groupedMatches, expanded, onToggleExpand }: MatchesListProps) {
  // Memoized computation of competitions and country grouping
  const { groupedCompetitions, countryMatchesMap } = useMemo(() => {
    // Get all unique competitions from matches to group them
    const allCompetitions = Object.entries(groupedMatches).map(([, dates]) => {
      const firstMatch = Object.values(dates).flat()[0];
      return firstMatch.competition;
    });

    const groupedCompetitions = groupCompetitionsByCountry(allCompetitions);

    // Pre-compute country matches map for better performance
    const countryMatchesMap = new Map<string, Record<string, Record<string, Match[]>>>();

    Object.entries(groupedCompetitions).forEach(([country, competitions]) => {
      const countryMatches = competitions.reduce((acc, comp) => {
        const formattedCompName = formatCompetitionName(comp.name);
        const compMatches = groupedMatches[formattedCompName];
        if (compMatches) {
          acc[formattedCompName] = compMatches;
        }
        return acc;
      }, {} as Record<string, Record<string, Match[]>>);

      if (Object.keys(countryMatches).length > 0) {
        countryMatchesMap.set(country, countryMatches);
      }
    });

    return { groupedCompetitions, countryMatchesMap };
  }, [groupedMatches]);

  return (
    <div className="space-y-8">
      {Array.from(countryMatchesMap.entries()).map(([country, countryMatches]) => {
        const competitions = groupedCompetitions[country];
        const totalMatchesInCountry = Object.values(countryMatches)
          .flatMap(dates => Object.values(dates))
          .flat().length;

        return (
          <div key={country} className="space-y-4">
            {/* Country Header */}
            <div className="flex items-center gap-3 px-1">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{country}</h2>
                <p className="text-slate-400 text-sm">{totalMatchesInCountry} meccs</p>
              </div>
            </div>

            {/* Competitions in this country */}
            <div className="space-y-4">
              {Object.entries(countryMatches).map(([competition, dates]) => {
                const competitionMatchCount = Object.values(dates).flat().length;
                const competitionObj = competitions.find(c => formatCompetitionName(c.name) === competition);

                return (
                  <Card
                    key={competitionObj?.id || competition}
                    className="bg-slate-800/50 border-slate-700/50 overflow-hidden"
                  >
                    <CardHeader className="pb-3 px-4 py-3 bg-slate-700/20 border-b border-slate-700/30">
                      <CardTitle className="flex items-center justify-between text-white text-base">
                        <span className="font-medium">{competition}</span>
                        <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                          {competitionMatchCount} meccs
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {Object.entries(dates).map(([date, matches]) => (
                        <div key={date} className="divide-y divide-slate-700/20">
                          {matches.map((match) => {
                            const matchStatus = getMatchStatus(match);
                            const isExpanded = expanded[match.id];

                            return (
                              <MatchCard
                                key={match.id}
                                match={match}
                                matchStatus={matchStatus}
                                competition={competition}
                                competitionMatchCount={competitionMatchCount}
                                isExpanded={isExpanded}
                                onToggleExpand={() => onToggleExpand(match.id)}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
});
