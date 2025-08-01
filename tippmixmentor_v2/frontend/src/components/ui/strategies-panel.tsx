import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { 
  Bookmark, 
  TrendingUp, 
  Target, 
  Clock, 
  Star, 
  Zap, 
  Edit, 
  Trash2,
  Plus 
} from 'lucide-react';
import { QuickFilterType } from './quick-filters';

interface Strategy {
  id: string;
  name: string;
  filterType: QuickFilterType;
  createdAt: string;
  hitRate: number;
  roi: number;
  totalPredictions: number;
  isActive: boolean;
}

interface StrategiesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onStrategySelect: (strategy: Strategy) => void;
  className?: string;
}

export function StrategiesPanel({
  isOpen,
  onClose,
  onStrategySelect,
  className = ''
}: StrategiesPanelProps) {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStrategyName, setNewStrategyName] = useState('');
  const [selectedFilterType, setSelectedFilterType] = useState<QuickFilterType>('my_feed');

  // Load strategies from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tmx_user_strategies');
      if (saved) {
        setStrategies(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save strategies to localStorage
  const saveStrategies = (newStrategies: Strategy[]) => {
    setStrategies(newStrategies);
    localStorage.setItem('tmx_user_strategies', JSON.stringify(newStrategies));
  };

  const handleCreateStrategy = () => {
    if (!newStrategyName.trim()) return;

    const newStrategy: Strategy = {
      id: Date.now().toString(),
      name: newStrategyName,
      filterType: selectedFilterType,
      createdAt: new Date().toISOString(),
      hitRate: 0,
      roi: 0,
      totalPredictions: 0,
      isActive: true,
    };

    const updatedStrategies = [...strategies, newStrategy];
    saveStrategies(updatedStrategies);
    setNewStrategyName('');
    setShowCreateForm(false);
  };

  const handleDeleteStrategy = (id: string) => {
    const updatedStrategies = strategies.filter(s => s.id !== id);
    saveStrategies(updatedStrategies);
  };

  const handleToggleStrategy = (id: string) => {
    const updatedStrategies = strategies.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    );
    saveStrategies(updatedStrategies);
  };

  const getFilterIcon = (filterType: QuickFilterType) => {
    switch (filterType) {
      case 'my_feed': return <Bookmark className="w-4 h-4" />;
      case 'live_value': return <Target className="w-4 h-4" />;
      case 'second_half_momentum': return <TrendingUp className="w-4 h-4" />;
      case 'favorites_underperforming': return <Star className="w-4 h-4" />;
      case 'comeback_potential': return <Zap className="w-4 h-4" />;
      case 'my_leagues': return <Bookmark className="w-4 h-4" />;
      default: return <Bookmark className="w-4 h-4" />;
    }
  };

  const getFilterLabel = (filterType: QuickFilterType) => {
    switch (filterType) {
      case 'my_feed': return 'My Feed';
      case 'live_value': return 'Live Value (O/U)';
      case 'second_half_momentum': return '2nd Half Momentum';
      case 'favorites_underperforming': return 'Favorites Struggling';
      case 'comeback_potential': return 'Comeback Potential';
      case 'my_leagues': return 'My Leagues';
      default: return 'My Feed';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-xl border-l border-gray-200 z-50 ${className}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">My Strategies</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Create New Strategy */}
          {showCreateForm ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Create New Strategy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input
                  type="text"
                  placeholder="Strategy name"
                  value={newStrategyName}
                  onChange={(e) => setNewStrategyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={selectedFilterType}
                  onChange={(e) => setSelectedFilterType(e.target.value as QuickFilterType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="my_feed">My Feed</option>
                  <option value="live_value">Live Value (O/U)</option>
                  <option value="second_half_momentum">2nd Half Momentum</option>
                  <option value="favorites_underperforming">Favorites Struggling</option>
                  <option value="comeback_potential">Comeback Potential</option>
                  <option value="my_leagues">My Leagues</option>
                </select>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateStrategy}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="w-full"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Strategy
            </Button>
          )}

          {/* Strategies List */}
          {strategies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bookmark className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No strategies yet</p>
              <p className="text-sm">Create your first strategy to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {strategies.map((strategy) => (
                <Card key={strategy.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getFilterIcon(strategy.filterType)}
                        <h3 className="font-medium text-gray-900">{strategy.name}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStrategy(strategy.id);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStrategy(strategy.id);
                          }}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getFilterLabel(strategy.filterType)}
                        </Badge>
                        {strategy.isActive && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            Active
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">{strategy.hitRate}%</div>
                          <div className="text-gray-500">Hit Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">{strategy.roi}%</div>
                          <div className="text-gray-500">ROI</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">{strategy.totalPredictions}</div>
                          <div className="text-gray-500">Predictions</div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Created {new Date(strategy.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 