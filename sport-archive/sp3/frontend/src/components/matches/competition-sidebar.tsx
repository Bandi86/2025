import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter, Star, ChevronDown, ChevronRight } from "lucide-react";
import { Competition } from "@/types/match";
import { groupCompetitionsByCountry } from "@/utils/match-helpers";
import { useState } from "react";

interface CompetitionSidebarProps {
  competitions: Competition[];
  selectedCompetitions: Set<string>;
  starredCompetitions: Set<string>;
  matchCountByCompetition: Record<string, number>;
  onToggleSelected: (competitionId: string) => void;
  onToggleStarred: (competitionId: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

export function CompetitionSidebar({
  competitions,
  selectedCompetitions,
  starredCompetitions,
  matchCountByCompetition,
  onToggleSelected,
  onToggleStarred,
  onSelectAll,
  onSelectNone
}: CompetitionSidebarProps) {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set(['Válogatott', 'Magyarország', 'Németország']));

  // Group competitions by country
  const groupedCompetitions = groupCompetitionsByCountry(competitions);

  const toggleCountryExpanded = (country: string) => {
    setExpandedCountries(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(country)) {
        newExpanded.delete(country);
      } else {
        newExpanded.add(country);
      }
      return newExpanded;
    });
  };

  return (
    <div className="w-80 flex-shrink-0">
      <Card className="bg-slate-800/50 border-slate-700/50 sticky top-32">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <Filter className="h-4 w-4" />
            Bajnokságok
            <Badge variant="outline" className="ml-auto border-slate-600 text-slate-300 text-xs">
              {competitions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1">
            {/* Select All/None */}
            <div className="flex gap-2 mb-4 pb-3 border-b border-slate-700/30">
              <button
                onClick={onSelectNone}
                className="flex-1 px-3 py-2 text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
              >
                Összes kiválaszt
              </button>
              <button
                onClick={onSelectAll}
                className="flex-1 px-3 py-2 text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
              >
                Mind törlése
              </button>
            </div>

            {/* Grouped competitions by country */}
            {Object.entries(groupedCompetitions).map(([country, countryCompetitions]) => {
              const isExpanded = expandedCountries.has(country);
              const totalMatches = countryCompetitions.reduce((sum, comp) => sum + (matchCountByCompetition[comp.id] || 0), 0);

              return (
                <div key={country} className="mb-3">
                  <button
                    onClick={() => toggleCountryExpanded(country)}
                    className="w-full flex items-center justify-between p-2 bg-slate-700/30 hover:bg-slate-700/50 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                      <span className="text-sm font-medium text-white">{country}</span>
                    </div>
                    {totalMatches > 0 && (
                      <Badge variant="secondary" className="bg-slate-600 text-slate-200 text-xs">
                        {totalMatches}
                      </Badge>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 ml-4 space-y-1">
                      {countryCompetitions.map((competition) => {
                        const matchCount = matchCountByCompetition[competition.id] || 0;
                        const isSelected = selectedCompetitions.has(competition.id);
                        const isStarred = starredCompetitions.has(competition.id);

                        return (
                          <CompetitionItem
                            key={competition.id}
                            competition={competition}
                            matchCount={matchCount}
                            isSelected={isSelected}
                            isStarred={isStarred}
                            onToggleSelected={() => onToggleSelected(competition.id)}
                            onToggleStarred={() => onToggleStarred(competition.id)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CompetitionItemProps {
  competition: Competition;
  matchCount: number;
  isSelected: boolean;
  isStarred: boolean;
  onToggleSelected: () => void;
  onToggleStarred: () => void;
}

function CompetitionItem({
  competition,
  matchCount,
  isSelected,
  isStarred,
  onToggleSelected,
  onToggleStarred
}: CompetitionItemProps) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg transition-colors group ${
      isSelected ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-slate-700/30'
    }`}>
      <button
        onClick={onToggleStarred}
        className={`p-1 rounded-sm transition-colors flex-shrink-0 ${
          isStarred ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-500 hover:text-slate-400'
        }`}
      >
        <Star className={`h-3.5 w-3.5 ${isStarred ? 'fill-current' : ''}`} />
      </button>

      <button
        onClick={onToggleSelected}
        className="flex-1 flex items-center justify-between text-left group min-w-0"
      >
        <span className={`text-sm truncate pr-2 ${
          isSelected ? 'text-white font-medium' : 'text-slate-300'
        }`}>
          {competition.name}
        </span>
        {matchCount > 0 && (
          <Badge variant="secondary" className={`text-xs flex-shrink-0 ${
            isSelected
              ? 'bg-blue-500/30 text-blue-200 border-blue-400/30'
              : 'bg-slate-600/50 text-slate-300 border-slate-500/30'
          }`}>
            {matchCount}
          </Badge>
        )}
      </button>
    </div>
  );
}
