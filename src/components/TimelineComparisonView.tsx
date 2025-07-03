// src/components/TimelineComparisonView.tsx
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClassColoredText } from './DirectColorStyles';
import { type RaidProgressAnalysis } from '@/types/comparison';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3, 
  Users, 
  Calendar,
  Target,
  Activity
} from 'lucide-react';

interface TimelineComparisonViewProps {
  analysis: RaidProgressAnalysis | null;
  loading: boolean;
}

const TimelineComparisonView: React.FC<TimelineComparisonViewProps> = ({ 
  analysis,
  loading 
}) => {
  const [filterTrend, setFilterTrend] = useState<'all' | 'improving' | 'declining' | 'stable' | 'inconsistent'>('all');
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

  if (!analysis) {
    return (
      <div className="w-full animate-fade-in">
        <div className="glass-morphism p-4 rounded-lg">
          <div className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">Need at least 2 reports to analyze raid progression over time.</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter players based on criteria
  const filteredPlayers = analysis.playerProgressions
    .filter(player => {
      if (filterTrend !== 'all' && player.overallTrend !== filterTrend) return false;
      
      if (showOnlySignificant) {
        const changeThreshold = parseInt(minimumChange) || 0;
        const totalChange = Math.abs(player.totalChange);
        return totalChange >= changeThreshold;
      }
      
      return true;
    })
    .sort((a, b) => b.totalChange - a.totalChange);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-500" />;
      case 'inconsistent': return <Activity className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getTrendBadge = (trend: string) => {
    const variants = {
      improving: 'bg-green-500/20 text-green-400',
      declining: 'bg-red-500/20 text-red-400',
      stable: 'bg-gray-500/20 text-gray-400',
      inconsistent: 'bg-yellow-500/20 text-yellow-400'
    };
    
    return (
      <Badge className={cn('capitalize', variants[trend as keyof typeof variants])}>
        {getTrendIcon(trend)}
        <span className="ml-1">{trend}</span>
      </Badge>
    );
  };

  const getChangeDisplay = (change: number) => {
    if (change === 0) return <span className="text-gray-500">No change</span>;
    
    const isPositive = change > 0;
    const color = isPositive ? 'text-green-500' : 'text-red-500';
    const sign = isPositive ? '+' : '';
    
    return (
      <span className={cn('font-medium', color)}>
        {sign}{change}%
      </span>
    );
  };

  const getRaidTrendIcon = () => {
    switch (analysis.raidTrend) {
      case 'improving': return <TrendingUp className="h-6 w-6 text-green-500" />;
      case 'declining': return <TrendingDown className="h-6 w-6 text-red-500" />;
      case 'stable': return <Minus className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="w-full animate-fade-in space-y-6">
      {/* Raid Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-morphism">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Raid Trend</CardTitle>
            {getRaidTrendIcon()}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{analysis.raidTrend}</div>
            <p className="text-xs text-muted-foreground">
              {getChangeDisplay(analysis.overallChange)} overall
            </p>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Analyzed</CardTitle>
            <BarChart3 className="h-6 w-6 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.summary.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              {analysis.summary.dateRange.start} to {analysis.summary.dateRange.end}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Player Progress</CardTitle>
            <Users className="h-6 w-6 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-green-400">Improving:</span>
                <span className="font-medium">{analysis.summary.playersImproving}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-400">Declining:</span>
                <span className="font-medium">{analysis.summary.playersDeclining}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Stable:</span>
                <span className="font-medium">{analysis.summary.playersStable}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Raid Average</CardTitle>
            <Target className="h-6 w-6 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysis.reportSnapshots[analysis.reportSnapshots.length - 1].raidAverages.totalAverage}%
            </div>
            <p className="text-xs text-muted-foreground">
              Current raid performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Overview */}
      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Raid Progress Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.reportSnapshots.map((snapshot, index) => (
              <div key={snapshot.reportId} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium">#{index + 1}</div>
                  <div>
                    <div className="font-medium">{snapshot.reportTitle}</div>
                    <div className="text-sm text-muted-foreground">{snapshot.formattedDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Raid Average</div>
                    <div className="font-bold">{snapshot.raidAverages.totalAverage}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Players</div>
                    <div className="font-bold">{snapshot.raidAverages.playerCount}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Player Progression Table */}
      <div className="glass-morphism p-4 rounded-lg">
        <div className="flex flex-col md:flex-row justify-between mb-4 items-start gap-4">
          <div>
            <h2 className="text-xl font-medium">Individual Player Progression</h2>
            <p className="text-sm text-muted-foreground">
              Performance trends across {analysis.summary.totalReports} reports
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
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trend</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Player</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Spec</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">First Report</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Latest Report</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Total Change</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Reports</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => (
                <tr 
                  key={player.playerName}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="py-3 text-sm">
                    {getTrendBadge(player.overallTrend)}
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
                    <span className="px-2 py-1 rounded-md bg-gray-500/20 text-gray-400">
                      {player.firstReportAverage}%
                    </span>
                  </td>
                  <td className="py-3 text-sm font-medium text-right">
                    <span 
                      className={cn(
                        "px-2 py-1 rounded-md",
                        player.lastReportAverage >= 95 ? "bg-green-500/20 text-green-400" :
                        player.lastReportAverage >= 75 ? "bg-blue-500/20 text-blue-400" :
                        player.lastReportAverage >= 50 ? "bg-purple-500/20 text-purple-400" :
                        player.lastReportAverage >= 25 ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-gray-500/20 text-gray-400"
                      )}
                    >
                      {player.lastReportAverage}%
                    </span>
                  </td>
                  <td className="py-3 text-sm font-bold text-right">
                    {getChangeDisplay(player.totalChange)}
                  </td>
                  <td className="py-3 text-sm text-muted-foreground text-right">
                    {player.dataPoints.length}
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

export default TimelineComparisonView;