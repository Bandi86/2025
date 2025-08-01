import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { LiveMatchCard } from './live-match-card';
import { LiveMatch } from '@/lib/api/dashboard-data';

interface VirtualizedMatchListProps {
  matches: LiveMatch[];
  isProUser?: boolean;
  onMatchClick?: (match: LiveMatch) => void;
  className?: string;
}

export function VirtualizedMatchList({
  matches,
  isProUser = false,
  onMatchClick,
  className = ''
}: VirtualizedMatchListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(matches.length / 3), // 3 columns per row
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated card height
    overscan: 5,
  });

  const getRowItems = (rowIndex: number) => {
    const startIndex = rowIndex * 3;
    return matches.slice(startIndex, startIndex + 3);
  };

  return (
    <div
      ref={parentRef}
      className={`h-[600px] overflow-auto ${className}`}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowItems = getRowItems(virtualRow.index);
          
          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full">
                {rowItems.map((match, colIndex) => (
                  <LiveMatchCard
                    key={match.id || `${virtualRow.index}-${colIndex}`}
                    id={match.id}
                    homeTeam={match.homeTeam}
                    awayTeam={match.awayTeam}
                    homeScore={match.homeScore}
                    awayScore={match.awayScore}
                    minute={match.minute}
                    status={match.status}
                    confidence={match.confidence}
                    league={match.league}
                    onClick={() => onMatchClick?.(match)}
                    isProUser={isProUser}
                    isHighConfidence={match.confidence ? match.confidence > 80 : false}
                    drivers={[
                      {
                        name: 'xG Differential',
                        value: 1.8,
                        impact: 'positive' as const,
                        description: 'Expected goals favor home team'
                      },
                      {
                        name: 'Shot Conversion',
                        value: 16.7,
                        impact: 'positive' as const,
                        description: 'Above average conversion rate'
                      }
                    ]}
                    trendData={Array.from({ length: 10 }, () => Math.random() * 100)}
                  />
                ))}
                {/* Fill empty slots to maintain grid */}
                {Array.from({ length: 3 - rowItems.length }).map((_, colIndex) => (
                  <div key={`empty-${colIndex}`} className="h-full" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 