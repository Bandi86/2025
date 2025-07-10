import { ChevronUp, ChevronDown } from "lucide-react";
import { Market } from "@/types/match";

interface OddsDisplayProps {
  market: Market | undefined;
  onExpand?: () => void;
  additionalMarketsCount?: number;
  isExpanded?: boolean;
}

export function OddsDisplay({
  market,
  onExpand,
  additionalMarketsCount = 0,
  isExpanded = false
}: OddsDisplayProps) {
  return (
    <div className="flex items-center gap-2 ml-6 flex-shrink-0">
      <div className="flex gap-2">
        <OddsButton
          label="1"
          odds={market?.odds1}
          variant="green"
        />
        <OddsButton
          label="X"
          odds={market?.oddsX}
          variant="yellow"
        />
        <OddsButton
          label="2"
          odds={market?.odds2}
          variant="blue"
        />
      </div>

      {/* Expand button */}
      {additionalMarketsCount > 0 && onExpand && (
        <button
          onClick={onExpand}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all ml-2"
          aria-label={isExpanded ? "Piacok bezárása" : "Több piac"}
        >
          <span className="text-sm font-medium">
            További piacok ({additionalMarketsCount})
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}

interface OddsButtonProps {
  label: string;
  odds?: number;
  variant: 'green' | 'yellow' | 'blue';
}

function OddsButton({ label, odds, variant }: OddsButtonProps) {
  const getVariantClasses = () => {
    if (!odds) {
      return 'bg-slate-700 text-slate-400 cursor-not-allowed';
    }

    switch (variant) {
      case 'green':
        return 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-md hover:shadow-green-500/20';
      case 'yellow':
        return 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white shadow-md hover:shadow-yellow-500/20';
      case 'blue':
        return 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-md hover:shadow-blue-500/20';
      default:
        return 'bg-slate-700 text-slate-400';
    }
  };

  return (
    <div className="text-center">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <button className={`px-3 py-2 rounded-md font-bold text-sm transition-all min-w-[50px] ${getVariantClasses()}`}>
        {odds || '-'}
      </button>
    </div>
  );
}
