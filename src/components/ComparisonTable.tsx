// src/components/ComparisonTable.tsx
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ClassColoredText } from './DirectColorStyles';
import { type PlayerComparison, type ComparisonData } from '@/types/comparison';
import { TrendingUp, TrendingDown, Minus, Plus, UserPlus, UserX } from 'lucide-react';

interface ComparisonTableProps {
  comparisonData: ComparisonData | null;
  loading: boolean;
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ 
  comparisonData,
  loading 
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'improved' | 'decreased' | 'new' | 'missing'>('all');
  const [minimumChange, setMinimumChange] = useState('0');
  const [showOnlySignificant, setShowOnlySignificant] = useState(false);

  if (loading) {
    return (
      <div className="w-full animate-fade-in">
        <div className="glass-morphism p-4 rounded-lg">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!comparisonData) {
    return (
      <div className="w-full animate-fade-in">
        <div className="glass-morphism p-4 rounded-lg">
          <div className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">Select two reports to compare performance changes.</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter and sort players based on criteria
  const filteredPlayers = comparisonData.playerComparisons
    .filter(player => {
      if (filterStatus !== 'all' && player.status !== filterStatus) return false;
      
      if (showOnlySignificant) {
        const changeThreshold = parseInt(minimumChange) || 0;
        const totalChange = Math.abs(player.changes.totalAverageChange);
        return totalChange >= changeThreshold;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by total average change (highest improvements first, then highest decreases)
      if (a.status === 'new' && b.status !== 'new') return -1;
      if (b.status === 'new' && a.status !== 'new') return 1;
      if (a.status === 'missing' && b.status !== 'missing') return 1;
      if (b.status === 'missing' && a.status !== 'missing') return -1;
      
      return b.changes.totalAverageChange - a.changes.totalAverageChange;
    });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'improved': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreased': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-500" />;
      case 'new': return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'missing': return <UserX className="h-4 w-4 text-orange-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      improved: 'bg-green-500/20 text-green-400',
      decreased: 'bg-red-500/20 text-red-400',
      stable: 'bg-gray-500/20 text-gray-400',
      new: 'bg-blue-500/20 text-blue-400',
      missing: 'bg-orange-500/20 text-orange-400'
    };
    
    return (
      <Badge className={cn('capitalize', variants[status as keyof typeof variants])}>
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    );
  };

  const getChangeDisplay = (change: number) => {
    if (change === 0) return <span className="text-gray-500">-</span>;
    
    const isPositive = change > 0;
    const icon = isPositive ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />;
    const color = isPositive ? 'text-green-500' : 'text-red-500';
    
    return (
      <span className={cn('flex items-center gap-1', color)}>
        {icon}
        {Math.abs(change)}%
      </span>
    );
  };

  // Calculate summary statistics
  const stats = {
    improved: filteredPlayers.filter(p => p.status === 'improved').length,
    decreased: filteredPlayers.filter(p => p.status === 'decreased').length,
    stable: filteredPlayers.filter(p => p.status === 'stable').length,
    new: filteredPlayers.filter(p => p.status === 'new').length,
    missing: filteredPlayers.filter(p => p.status === 'missing').length,
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="glass-morphism p-4 rounded-lg">
        <div className="flex flex-col md:flex-row justify-between mb-4 items-start gap-4">
          <div>
            <h2 className="text-xl font-medium">Performance Comparison</h2>
            <p className="text-sm text-muted-foreground">
              {comparisonData.baselineTitle} vs {comparisonData.compareTitle}
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex items-center space-x-2">
              <Switch 
                id="significant-changes" 
                checked={showOnlySignificant}
                onCheckedChange={setShowOnlySignificant}
              />
              <Label htmlFor="significant-changes" className="text-sm">
                Significant Changes Only
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Input 
                type="number" 
                value={minimumChange}
                onChange={(e) => setMinimumChange(e.target.value)}
                className="w-20"
                min="0"
                max="100"
                placeholder="0"
              />
              <Label className="text-sm">Min Change %</Label>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="glass-morphism p-3 rounded-lg text-center">
            <div className="text-green-500 font-bold text-xl">{stats.improved}</div>
            <div className="text-xs text-muted-foreground">Improved</div>
          </div>
          <div className="glass-morphism p-3 rounded-lg text-center">
            <div className="text-red-500 font-bold text-xl">{stats.decreased}</div>
            <div className="text-xs text-muted-foreground">Decreased</div>
          </div>
          <div className="glass-morphism p-3 rounded-lg text-center">
            <div className="text-gray-500 font-bold text-xl">{stats.stable}</div>
            <div className="text-xs text-muted-foreground">Stable</div>
          </div>
          <div className="glass-morphism p-3 rounded-lg text-center">
            <div className="text-blue-500 font-bold text-xl">{stats.new}</div>
            <div className="text-xs text-muted-foreground">New</div>
          </div>
          <div className="glass-morphism p-3 rounded-lg text-center">
            <div className="text-orange-500 font-bold text-xl">{stats.missing}</div>
            <div className="text-xs text-muted-foreground">Missing</div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Player</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Spec</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Previous</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Current</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Parse Change</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Mechanics Change</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Total Change</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => (
                <tr 
                  key={player.playerName}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="py-3 text-sm">
                    {getStatusBadge(player.status)}
                  </td>
                  <td className="py-3 text-sm">
                    <ClassColoredText wowClass={player.class}>
                      {player.playerName}
                    </ClassColoredText>
                  </td>
                  <td className="py-3 text-sm text-muted-foreground">
                    {player.spec || 'Unknown'} {player.class}
                  </td>
                  <td className="py-3 text-sm font-medium text-right">
                    {player.previousReport ? (
                      <span className="px-2 py-1 rounded-md bg-gray-500/20 text-gray-400">
                        {player.previousReport.totalAverage}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-3 text-sm font-medium text-right">
                    {player.currentReport ? (
                      <span 
                        className={cn(
                          "px-2 py-1 rounded-md",
                          player.currentReport.totalAverage >= 95 ? "bg-green-500/20 text-green-400" :
                          player.currentReport.totalAverage >= 75 ? "bg-blue-500/20 text-blue-400" :
                          player.currentReport.totalAverage >= 50 ? "bg-purple-500/20 text-purple-400" :
                          player.currentReport.totalAverage >= 25 ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-gray-500/20 text-gray-400"
                        )}
                      >
                        {player.currentReport.totalAverage}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-3 text-sm font-medium text-right">
                    {getChangeDisplay(player.changes.averagePercentileChange)}
                  </td>
                  <td className="py-3 text-sm font-medium text-right">
                    {getChangeDisplay(player.changes.wipefestScoreChange)}
                  </td>
                  <td className="py-3 text-sm font-bold text-right">
                    {getChangeDisplay(player.changes.totalAverageChange)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPlayers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No players match the current filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonTable;