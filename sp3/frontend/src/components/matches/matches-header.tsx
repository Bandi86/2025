import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime } from 'luxon';
import { formatDayName } from '@/utils/match-helpers';

interface MatchesHeaderProps {
  liveMatchesCount: number;
  dateNavigation: {
    prev: string;
    next: string;
    current: string;
  };
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function MatchesHeader({
  liveMatchesCount,
  selectedDate,
  onDateChange
}: Omit<MatchesHeaderProps, 'dateNavigation'>) {
  return (
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

          <div className="flex items-center gap-4">
            <DateNavigation
              selectedDate={selectedDate}
              onDateChange={onDateChange}
            />

            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              <Clock className="h-3 w-3 mr-1" />
              {liveMatchesCount} Élő
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function DateNavigation({ selectedDate, onDateChange }: { selectedDate: string, onDateChange: (date: string) => void }) {
  // Egyszerű, megbízható dátumkezelés
  const handlePrev = () => {
    const prevDate = DateTime.fromISO(selectedDate).minus({ days: 1 }).toFormat('yyyy-MM-dd');
    onDateChange(prevDate);
  };

  const handleNext = () => {
    const nextDate = DateTime.fromISO(selectedDate).plus({ days: 1 }).toFormat('yyyy-MM-dd');
    onDateChange(nextDate);
  };

  // Használjuk a formatDayName függvényt konzisztencia érdekében
  const dayName = formatDayName(selectedDate);
  const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  const dateStr = DateTime.fromISO(selectedDate).toFormat('yyyy.MM.dd.');
  const today = DateTime.now().setZone('Europe/Budapest').toFormat('yyyy-MM-dd');
  const isToday = selectedDate === today;

  return (
    <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-5 py-3 border border-slate-700/50">
      <button
        onClick={handlePrev}
        className="p-2 hover:bg-slate-700/50 rounded-md transition-colors"
      >
        <ChevronLeft className="h-4 w-4 text-slate-300" />
      </button>

      <div className="px-4 py-1 min-w-[120px] text-center">
        <div className="text-white font-semibold text-base mb-1">
          {isToday ? 'Ma' : capitalizedDayName}
        </div>
        <div className="text-slate-400 text-sm">
          {dateStr}
        </div>
      </div>

      <button
        onClick={handleNext}
        className="p-2 hover:bg-slate-700/50 rounded-md transition-colors"
      >
        <ChevronRight className="h-4 w-4 text-slate-300" />
      </button>
    </div>
  );
}
