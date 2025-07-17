"use client";

import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import { Match } from "@/types/match";
import { useMatches } from "@/hooks/use-matches";
import { formatCompetitionName } from "@/utils/match-helpers";
import { MatchesHeader } from "@/components/matches/matches-header";
import { CompetitionSidebar } from "@/components/matches/competition-sidebar";
import { MatchesList } from "@/components/matches/matches-list";
import { LoadingState, ErrorState, EmptyState } from "@/components/matches/match-states";

export default function MatchesPage() {
  // Egyszerű, megbízható dátumkezelés - mindig ISO formátum
  const [selectedDate, setSelectedDate] = useState<string>(
    DateTime.now().setZone('Europe/Budapest').toFormat('yyyy-MM-dd')
  );
  const { matches, loading, error } = useMatches(selectedDate);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [starredCompetitions, setStarredCompetitions] = useState<Set<string>>(new Set());
  const [selectedCompetitions, setSelectedCompetitions] = useState<Set<string>>(new Set());

  // Optimalizált dátum szűrő függvény
  const getMatchDateISO = (match: Match): string => {
    return DateTime.fromISO(match.date).setZone('Europe/Budapest').toFormat('yyyy-MM-dd');
  };

  // Auto-select best available date when matches load
  useEffect(() => {
    if (matches.length > 0) {
      const today = DateTime.now().setZone('Europe/Budapest').toFormat('yyyy-MM-dd');

      const todayMatches = matches.filter(match => getMatchDateISO(match) === today);

      if (todayMatches.length === 0) {
        // Find best available date with matches
        const uniqueDates = Array.from(new Set(matches.map(getMatchDateISO))).sort();
        const todayDateTime = DateTime.fromISO(today);

        let bestDate = uniqueDates[0];
        let minDiff = Math.abs(DateTime.fromISO(uniqueDates[0]).diff(todayDateTime).as('days'));

        uniqueDates.forEach(date => {
          const diff = Math.abs(DateTime.fromISO(date).diff(todayDateTime).as('days'));
          if (diff < minDiff) {
            minDiff = diff;
            bestDate = date;
          }
        });

        setSelectedDate(bestDate);
      }
    }
  }, [matches]);

  // Get unique competitions from matches
  const allCompetitions = Array.from(
    new Map(matches.map(match => [match.competition.id, match.competition])).values()
  ).sort((a, b) => a.name.localeCompare(b.name, 'hu'));

  // Filter matches by selected date and competitions - optimalizált
  const filteredMatches = matches.filter(match => {
    const dateMatch = getMatchDateISO(match) === selectedDate;
    const competitionMatch = selectedCompetitions.size === 0 || selectedCompetitions.has(match.competition.id);
    return dateMatch && competitionMatch;
  });

  // Debug: log filtering results
  console.log(`🔍 Filter Debug for ${selectedDate}:`);
  console.log(`   Total matches: ${matches.length}`);
  console.log(`   Selected competitions: ${selectedCompetitions.size === 0 ? 'ALL' : Array.from(selectedCompetitions).length}`);
  console.log(`   Date-filtered matches: ${matches.filter(m => getMatchDateISO(m) === selectedDate).length}`);
  console.log(`   Final filtered matches: ${filteredMatches.length}`);

  // Group filtered matches by competition name, then by date - optimalizált
  const grouped: Record<string, Record<string, Match[]>> = {};
  filteredMatches.forEach((match) => {
    const comp = formatCompetitionName(match.competition.name);
    const date = DateTime.fromISO(match.date).setZone('Europe/Budapest').toFormat('yyyy.MM.dd.');
    if (!grouped[comp]) grouped[comp] = {};
    if (!grouped[comp][date]) grouped[comp][date] = [];
    grouped[comp][date].push(match);
  });

  // Calculate match counts by competition for selected date - optimalizált
  const matchCountByCompetition: Record<string, number> = {};
  allCompetitions.forEach(competition => {
    matchCountByCompetition[competition.id] = matches.filter(m =>
      m.competition.id === competition.id && getMatchDateISO(m) === selectedDate
    ).length;
  });

  // Event handlers
  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleStarredCompetition = (competitionId: string) => {
    setStarredCompetitions(prev => {
      const newStarred = new Set(prev);
      if (newStarred.has(competitionId)) {
        newStarred.delete(competitionId);
      } else {
        newStarred.add(competitionId);
      }
      return newStarred;
    });
  };

  const toggleSelectedCompetition = (competitionId: string) => {
    setSelectedCompetitions(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(competitionId)) {
        newSelected.delete(competitionId);
      } else {
        newSelected.add(competitionId);
      }
      return newSelected;
    });
  };

  const handleSelectAllCompetitions = () => {
    setSelectedCompetitions(new Set(allCompetitions.map(comp => comp.id)));
  };

  const handleSelectNoCompetitions = () => {
    setSelectedCompetitions(new Set());
  };

  // Calculate live matches count
  const liveMatchesCount = filteredMatches.filter(m => m.status === 'LIVE').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <MatchesHeader
        liveMatchesCount={liveMatchesCount}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <CompetitionSidebar
            competitions={allCompetitions}
            selectedCompetitions={selectedCompetitions}
            starredCompetitions={starredCompetitions}
            matchCountByCompetition={matchCountByCompetition}
            onToggleSelected={toggleSelectedCompetition}
            onToggleStarred={toggleStarredCompetition}
            onSelectAll={handleSelectAllCompetitions}
            onSelectNone={handleSelectNoCompetitions}
          />

          <div className="flex-1">
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState error={error} />
            ) : Object.keys(grouped).length === 0 ? (
              <EmptyState />
            ) : (
              <MatchesList
                groupedMatches={grouped}
                expanded={expanded}
                onToggleExpand={toggleExpand}
              />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-2">
        <div className="text-slate-400 text-sm">
          Megjelenített meccsek: <span className="text-white font-bold">{filteredMatches.length}</span>
        </div>
      </div>
    </div>
  );
}
