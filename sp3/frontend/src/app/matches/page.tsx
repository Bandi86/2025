"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Calendar, Clock, Trophy, Star, Target, Filter, ChevronLeft, ChevronRight } from "lucide-react";

interface Market {
  id: string;
  name: string;
  origName?: string;
  odds1?: number;
  oddsX?: number;
  odds2?: number;
  createdAt: string;
  updatedAt: string;
}

interface Team {
  id: string;
  name: string;
  shortName?: string;
}

interface Competition {
  id: string;
  name: string;
  shortName?: string;
  country: string;
}

interface Match {
  id: string;
  date: string;
  homeTeam: Team;
  awayTeam: Team;
  competition: Competition;
  homeScore?: number;
  awayScore?: number;
  status: string;
  round?: number;
  matchday?: number;
  season: string;
  venue?: string;
  createdAt: string;
  updatedAt: string;
  markets?: Market[];
}

// Helper to get team logo (placeholder for now)
function getTeamLogo(team: Team) {
  // In a real app, you would map team.id or team.name to a logo file
  // For now, always return the placeholder
  return `/team-logos/placeholder.svg`;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [starredCompetitions, setStarredCompetitions] = useState<Set<string>>(new Set());
  const [selectedCompetitions, setSelectedCompetitions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    fetch(`${apiUrl}/api/matches?page=1&limit=1000`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.data)) {
          setMatches(data.data);
          // Ha a mai napra nincsenek meccsek, váltson a legfrissebb elérhető dátumra
          const todayDate = new Date();
          const todayLocal = new Date(todayDate.getTime() - todayDate.getTimezoneOffset() * 60000)
            .toISOString().split('T')[0];
          const todayMatches = data.data.filter((match: Match) => {
            const matchDate = new Date(match.date);
            const localDateString = new Date(matchDate.getTime() - matchDate.getTimezoneOffset() * 60000)
              .toISOString().split('T')[0];
            return localDateString === todayLocal;
          });
          if (todayMatches.length === 0 && data.data.length > 0) {
            // Keresünk egy dátumot, ahol vannak meccsek (helyi idő szerint)
            const matchDates: string[] = data.data.map((match: Match) => {
              const matchDate = new Date(match.date);
              return new Date(matchDate.getTime() - matchDate.getTimezoneOffset() * 60000)
                .toISOString().split('T')[0];
            });
            const uniqueDates: string[] = Array.from(new Set(matchDates)).sort();
            // A legközelebb eső dátumot válasszuk (lehet múlt vagy jövő)
            const today = new Date(todayLocal);
            let bestDate: string = uniqueDates[0];
            let minDiff = Math.abs(new Date(uniqueDates[0]).getTime() - today.getTime());
            uniqueDates.forEach((date: string) => {
              const diff = Math.abs(new Date(date).getTime() - today.getTime());
              if (diff < minDiff) {
                minDiff = diff;
                bestDate = date;
              }
            });
            setSelectedDate(bestDate);
          }
        } else {
          setMatches([]);
        }
      })
      .catch(() => setError("Nem sikerült betölteni a meccs adatokat."))
      .finally(() => setLoading(false));
  }, []);

  // Helper functions
  const formatCompetitionName = (name: string) => {
    // Remove extra characters and clean up competition names
    return name.replace(/[^\w\s\-áéíóöőúüű]/gi, '').trim();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\./g, '.').replace(/(\d{4})\.(\d{2})\.(\d{2})/, '$1.$2.$3.');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('hu-HU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Budapest'
    });
  };

  const capitalizeTeamName = (name: string) => {
    return name.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getMatchStatus = (match: Match) => {
    const now = new Date();
    const matchDate = new Date(match.date);
    const diffMinutes = (matchDate.getTime() - now.getTime()) / (1000 * 60);

    if (match.status === 'LIVE' || match.status === 'IN_PLAY') {
      return { type: 'live', label: 'ÉLŐ' };
    } else if (diffMinutes > 15) {
      return { type: 'upcoming', label: 'Közelgő' };
    } else if (diffMinutes > -120 && diffMinutes <= 15) {
      return { type: 'soon', label: 'Hamarosan' };
    } else if (match.homeScore !== undefined && match.awayScore !== undefined) {
      return { type: 'finished', label: 'Véget ért' };
    } else {
      return { type: 'upcoming', label: 'Jövőbeli' };
    }
  };

  // Get unique competitions from matches
  const allCompetitions = Array.from(new Set(matches.map(match => match.competition.name)))
    .map(name => formatCompetitionName(name))
    .sort();

  // Sort competitions: starred first, then alphabetically
  const sortedCompetitions = allCompetitions.sort((a, b) => {
    const aStarred = starredCompetitions.has(a);
    const bStarred = starredCompetitions.has(b);
    if (aStarred && !bStarred) return -1;
    if (!aStarred && bStarred) return 1;
    return a.localeCompare(b, 'hu');
  });

  // Filter matches by selected date and competitions
  const filteredMatches = matches.filter(match => {
    // Convert match date to local timezone date string (YYYY-MM-DD)
    const matchDate = new Date(match.date);
    const localDateString = new Date(matchDate.getTime() - matchDate.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];
    const competitionName = formatCompetitionName(match.competition.name);

    const dateMatch = localDateString === selectedDate;
    const competitionMatch = selectedCompetitions.size === 0 || selectedCompetitions.has(competitionName);

    return dateMatch && competitionMatch;
  });

  // Group filtered matches by competition name, then by date
  const grouped: Record<string, Record<string, Match[]>> = {};
  filteredMatches.forEach((match) => {
    const comp = formatCompetitionName(match.competition.name);
    const date = formatDate(match.date);
    if (!grouped[comp]) grouped[comp] = {};
    if (!grouped[comp][date]) grouped[comp][date] = [];
    grouped[comp][date].push(match);
  });

  // Sort grouped competitions: starred first, then alphabetically
  const sortedGroupedEntries = Object.entries(grouped).sort(([a], [b]) => {
    const aStarred = starredCompetitions.has(a);
    const bStarred = starredCompetitions.has(b);
    if (aStarred && !bStarred) return -1;
    if (!aStarred && bStarred) return 1;
    return a.localeCompare(b, 'hu');
  });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleStarredCompetition = (competition: string) => {
    setStarredCompetitions(prev => {
      const newStarred = new Set(prev);
      if (newStarred.has(competition)) {
        newStarred.delete(competition);
      } else {
        newStarred.add(competition);
      }
      return newStarred;
    });
  };

  const toggleSelectedCompetition = (competition: string) => {
    setSelectedCompetitions(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(competition)) {
        newSelected.delete(competition);
      } else {
        newSelected.add(competition);
      }
      return newSelected;
    });
  };

  const getDateNavigation = () => {
    const currentDate = new Date(selectedDate);
    const prevDate = new Date(currentDate);
    prevDate.setDate(currentDate.getDate() - 1);
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);

    return {
      prev: prevDate.toISOString().split('T')[0],
      next: nextDate.toISOString().split('T')[0],
      current: currentDate.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Sport Meccsek</h1>
                <p className="text-slate-400 text-sm">Élő eredmények és fogadási szorzók</p>
              </div>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-700/50">
                <button
                  onClick={() => setSelectedDate(getDateNavigation().prev)}
                  className="p-1.5 hover:bg-slate-700/50 rounded-md transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-300" />
                </button>
                <div className="px-3 py-1">
                  <div className="text-white font-medium text-sm">{getDateNavigation().current}</div>
                  <div className="text-slate-400 text-xs text-center">
                    {selectedDate === new Date().toISOString().split('T')[0] ? 'Ma' : formatDate(selectedDate + 'T00:00:00')}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDate(getDateNavigation().next)}
                  className="p-1.5 hover:bg-slate-700/50 rounded-md transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </button>
              </div>

              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                <Clock className="h-3 w-3 mr-1" />
                {filteredMatches.filter(m => m.status === 'LIVE').length} Élő
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Competitions */}
          <div className="w-80 flex-shrink-0">
            <Card className="bg-slate-800/50 border-slate-700/50 sticky top-32">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                  <Filter className="h-4 w-4" />
                  Bajnokságok
                  <Badge variant="outline" className="ml-auto border-slate-600 text-slate-300 text-xs">
                    {allCompetitions.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {/* Select All/None */}
                  <div className="flex gap-2 mb-3 pb-3 border-b border-slate-700/30">
                    <button
                      onClick={() => setSelectedCompetitions(new Set())}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
                    >
                      Összes
                    </button>
                    <button
                      onClick={() => setSelectedCompetitions(new Set(allCompetitions))}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
                    >
                      Kijelöl
                    </button>
                  </div>

                  {sortedCompetitions.map((competition) => {
                    const matchCount = matches.filter(m =>
                      formatCompetitionName(m.competition.name) === competition &&
                      new Date(m.date).toISOString().split('T')[0] === selectedDate
                    ).length;
                    const isSelected = selectedCompetitions.has(competition);
                    const isStarred = starredCompetitions.has(competition);

                    // Find the first match with this competition to get the ID
                    const competitionMatch = matches.find(m => formatCompetitionName(m.competition.name) === competition);
                    const competitionId = competitionMatch?.competition.id || competition;

                    return (
                      <div key={`${competitionId}-${competition}`} className={`flex items-center gap-2 p-2 rounded-md transition-colors group ${
                        isSelected ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-slate-700/30'
                      }`}>
                        <button
                          onClick={() => toggleStarredCompetition(competition)}
                          className={`p-1 rounded-sm transition-colors ${
                            isStarred ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-500 hover:text-slate-400'
                          }`}
                        >
                          <Star className={`h-3.5 w-3.5 ${isStarred ? 'fill-current' : ''}`} />
                        </button>

                        <button
                          onClick={() => toggleSelectedCompetition(competition)}
                          className="flex-1 flex items-center justify-between text-left group"
                        >
                          <span className={`text-sm truncate ${
                            isSelected ? 'text-white font-medium' : 'text-slate-300'
                          }`}>
                            {competition}
                          </span>
                          {matchCount > 0 && (
                            <Badge variant="secondary" className={`ml-2 text-xs ${
                              isSelected
                                ? 'bg-blue-500/30 text-blue-200 border-blue-400/30'
                                : 'bg-slate-700 text-slate-300'
                            }`}>
                              {matchCount}
                            </Badge>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-48 bg-slate-700" />
                        <Skeleton className="h-4 w-20 bg-slate-700" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                          <Skeleton className="h-8 w-64 bg-slate-700" />
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-12 bg-slate-700" />
                            <Skeleton className="h-8 w-12 bg-slate-700" />
                            <Skeleton className="h-8 w-12 bg-slate-700" />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="bg-red-900/20 border-red-500/30">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Target className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-400 text-lg font-medium">{error}</p>
                    <p className="text-slate-400 text-sm mt-2">Próbáld újra egy kicsit később</p>
                  </div>
                </CardContent>
              </Card>
            ) : Object.keys(grouped).length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">Nincs meccs ezen a napon</p>
                    <p className="text-slate-500 text-sm mt-2">Válassz másik dátumot vagy bajnokságot</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {sortedGroupedEntries.map(([competition, dates]) => {
                  // Find the first match with this competition to get the ID
                  const competitionMatch = Object.values(dates).flat()[0];
                  const competitionId = competitionMatch?.competition.id || competition;

                  return (
                    <Card key={`${competitionId}-${competition}`} className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
                      <CardContent className="p-0">
                        {Object.entries(dates).map(([date, matches]) => (
                          <div key={date} className="border-b border-slate-700/30 last:border-b-0">
                            <div className="divide-y divide-slate-700/20">
                              {matches.map((match) => {
                                const mainMarket = match.markets?.find(m =>
                                  m.name.toLowerCase().includes("fő piac") ||
                                  m.name.toLowerCase().includes("main") ||
                                  m.name.toLowerCase().includes("1x2")
                                ) || match.markets?.[0];
                                const otherMarkets = match.markets?.filter(m => m.id !== mainMarket?.id) || [];
                                const isExpanded = expanded[match.id];
                                const matchStatus = getMatchStatus(match);

                                // Dynamic card styling based on match status
                                const getCardBg = () => {
                                  switch (matchStatus.type) {
                                    case 'live':
                                      return 'bg-red-900/10 border-l-4 border-red-500/50 hover:bg-red-900/20';
                                    case 'soon':
                                      return 'bg-orange-900/10 border-l-4 border-orange-500/50 hover:bg-orange-900/20';
                                    case 'finished':
                                      return 'bg-slate-700/20 border-l-4 border-slate-500/30 hover:bg-slate-700/30';
                                    default:
                                      return 'hover:bg-slate-700/15';
                                  }
                                };

                                return (
                                  <div key={match.id}>
                                    <div className={`px-4 py-4 transition-colors ${getCardBg()}`}>
                                      <div className="flex items-center justify-between">
                                        {/* Match Info */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-4 mb-3">
                                            {/* Time with better typography */}
                                            <div className="flex items-center gap-2">
                                              <Clock className="h-4 w-4 text-slate-400" />
                                              <span className="font-mono text-base font-bold text-white tracking-wider">
                                                {formatTime(match.date)}
                                              </span>
                                            </div>

                                            {/* Competition name and match count */}
                                            <div className="flex items-center gap-3">
                                              <div className="p-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-sm">
                                                <Trophy className="h-3 w-3 text-white" />
                                              </div>
                                              <span className="text-slate-300 text-sm font-medium">{competition}</span>
                                              <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                                                {Object.values(grouped[competition]).flat().length}
                                              </Badge>
                                            </div>

                                            {/* Status badges */}
                                            {matchStatus.type === 'live' && (
                                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse text-xs px-2 py-0.5">
                                                {matchStatus.label}
                                              </Badge>
                                            )}
                                            {matchStatus.type === 'soon' && (
                                              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs px-2 py-0.5">
                                                {matchStatus.label}
                                              </Badge>
                                            )}
                                            {matchStatus.type === 'finished' && (
                                              <Badge variant="secondary" className="bg-slate-700 text-white text-xs px-2 py-0.5">
                                                {match.homeScore} - {match.awayScore}
                                              </Badge>
                                            )}
                                          </div>

                                          {/* Teams in one line with proper alignment */}
                                          <div className="flex items-center justify-center gap-4 text-white max-w-md">
                                            <div className="flex items-center gap-2 flex-1 justify-end">
                                              <span className="font-semibold text-base text-right min-w-0">
                                                {capitalizeTeamName(match.homeTeam.name)}
                                              </span>
                                              <img
                                                src={getTeamLogo(match.homeTeam)}
                                                alt="logo"
                                                className="w-5 h-5 rounded border border-slate-600 flex-shrink-0"
                                              />
                                            </div>

                                            <span className="text-slate-400 font-bold text-lg px-3 flex-shrink-0">-</span>

                                            <div className="flex items-center gap-2 flex-1">
                                              <img
                                                src={getTeamLogo(match.awayTeam)}
                                                alt="logo"
                                                className="w-5 h-5 rounded border border-slate-600 flex-shrink-0"
                                              />
                                              <span className="font-semibold text-base min-w-0">
                                                {capitalizeTeamName(match.awayTeam.name)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Odds */}
                                        <div className="flex items-center gap-2 ml-6 flex-shrink-0">
                                          <div className="flex gap-2">
                                            <div className="text-center">
                                              <div className="text-xs text-slate-400 mb-1">1</div>
                                              <button className={`px-3 py-2 rounded-md font-bold text-sm transition-all min-w-[50px] ${
                                                mainMarket?.odds1
                                                  ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-md hover:shadow-green-500/20'
                                                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                              }`}>
                                                {mainMarket?.odds1 || '-'}
                                              </button>
                                            </div>
                                            <div className="text-center">
                                              <div className="text-xs text-slate-400 mb-1">X</div>
                                              <button className={`px-3 py-2 rounded-md font-bold text-sm transition-all min-w-[50px] ${
                                                mainMarket?.oddsX
                                                  ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white shadow-md hover:shadow-yellow-500/20'
                                                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                              }`}>
                                                {mainMarket?.oddsX || '-'}
                                              </button>
                                            </div>
                                            <div className="text-center">
                                              <div className="text-xs text-slate-400 mb-1">2</div>
                                              <button className={`px-3 py-2 rounded-md font-bold text-sm transition-all min-w-[50px] ${
                                                mainMarket?.odds2
                                                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-md hover:shadow-blue-500/20'
                                                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                              }`}>
                                                {mainMarket?.odds2 || '-'}
                                              </button>
                                            </div>
                                          </div>

                                          {/* Expand button with text */}
                                          {otherMarkets.length > 0 && (
                                            <button
                                              onClick={() => toggleExpand(match.id)}
                                              className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all ml-2"
                                              aria-label={isExpanded ? "Piacok bezárása" : "Több piac"}
                                            >
                                              <span className="text-sm font-medium">
                                                További piacok ({otherMarkets.length})
                                              </span>
                                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Expanded Markets */}
                                    {isExpanded && otherMarkets.length > 0 && (
                                      <div className="px-4 pb-4 bg-slate-700/10 border-t border-slate-700/20">
                                        <div className="mt-3">
                                          <h4 className="text-slate-300 font-medium mb-2 flex items-center gap-2 text-sm">
                                            <Star className="h-3.5 w-3.5" />
                                            További piacok
                                          </h4>
                                          <div className="space-y-2">
                                            {otherMarkets.map((market) => (
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
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
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
