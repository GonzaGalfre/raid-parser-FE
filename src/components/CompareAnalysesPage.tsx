import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  GitCompare, 
  Calendar, 
  Users, 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  CheckSquare,
  Square
} from 'lucide-react';
import { analysisService } from '../services/analysisService';
import { AnalysisMetadata } from '../types/storage';
import { PlayerAverage } from '../services/warcraftLogsApi';

interface CompareAnalysesPageProps {
  // We could add props here if needed for navigation or callbacks
}

interface AnalysisSnapshot {
  id: string;
  name: string;
  zone: string;
  raidDate: string;
  formattedRaidDate: string;
  createdAt: string;
  players: PlayerAverage[];
  raidAverages: {
    averagePercentile: number;
    wipefestScore: number;
    totalAverage: number;
    playerCount: number;
  };
}

interface PlayerProgression {
  playerName: string;
  class: string;
  spec: string | null;
  dataPoints: Array<{
    analysisId: string;
    analysisName: string;
    date: string;
    averagePercentile: number;
    wipefestScore: number;
    totalAverage: number;
    present: boolean;
  }>;
  overallTrend: 'improving' | 'declining' | 'stable' | 'new' | 'inconsistent';
  totalChange: number;
  firstValue: number;
  lastValue: number;
}

interface ComparisonResult {
  snapshots: AnalysisSnapshot[];
  playerProgressions: PlayerProgression[];
  raidProgression: {
    overallChange: number;
    trend: 'improving' | 'declining' | 'stable';
  };
}

const CompareAnalysesPage: React.FC<CompareAnalysesPageProps> = () => {
  const [analyses, setAnalyses] = useState<AnalysisMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [selectedAnalyses, setSelectedAnalyses] = useState<Set<string>>(new Set());
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      const analysesData = await analysisService.getAllAnalyses();
      setAnalyses(analysesData);
    } catch (error) {
      console.error('Error loading analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyses();
  }, []);

  const canCompare = selectedAnalyses.size >= 2;

  const toggleAnalysisSelection = (analysisId: string) => {
    const newSelection = new Set(selectedAnalyses);
    if (newSelection.has(analysisId)) {
      newSelection.delete(analysisId);
    } else {
      newSelection.add(analysisId);
    }
    setSelectedAnalyses(newSelection);
  };

  const selectAll = () => {
    setSelectedAnalyses(new Set(analyses.map(a => a.id)));
  };

  const clearAll = () => {
    setSelectedAnalyses(new Set());
  };

  const calculateComparison = async () => {
    if (!canCompare) return;

    setComparing(true);
    try {
      // Load all selected analyses
      const selectedAnalysisIds = Array.from(selectedAnalyses);
      const loadedAnalyses = await Promise.all(
        selectedAnalysisIds.map(id => analysisService.loadAnalysis(id))
      );

      if (loadedAnalyses.some(analysis => !analysis)) {
        throw new Error('Failed to load one or more analyses');
      }

      // Create snapshots sorted by date
      const snapshots: AnalysisSnapshot[] = loadedAnalyses
        .map((analysis, index) => {
          const metadata = analyses.find(a => a.id === selectedAnalysisIds[index]);
          
          // Calculate raid averages
          const raidAverages = {
            averagePercentile: Math.round(
              analysis.players.reduce((sum: number, p: PlayerAverage) => sum + p.averagePercentile, 0) / analysis.players.length
            ),
            wipefestScore: Math.round(
              analysis.players.reduce((sum: number, p: PlayerAverage) => sum + p.wipefestScore, 0) / analysis.players.length
            ),
            totalAverage: Math.round(
              analysis.players.reduce((sum: number, p: PlayerAverage) => sum + p.totalAverage, 0) / analysis.players.length
            ),
            playerCount: analysis.players.length
          };

          return {
            id: selectedAnalysisIds[index],
            name: analysis.name,
            zone: metadata?.zone || 'Unknown',
            raidDate: metadata?.dateRange?.earliest ? metadata.dateRange.earliest.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            formattedRaidDate: new Date(metadata?.dateRange?.earliest || new Date()).toLocaleDateString(),
            createdAt: metadata?.createdAt ? metadata.createdAt.toISOString() : new Date().toISOString(),
            players: analysis.players,
            raidAverages
          };
        })
        .sort((a, b) => new Date(a.raidDate).getTime() - new Date(b.raidDate).getTime());

      // Get all unique players across all analyses
      const allPlayers = new Set<string>();
      snapshots.forEach(snapshot => {
        snapshot.players.forEach(player => {
          allPlayers.add(player.playerName);
        });
      });

      // Calculate player progressions
      const playerProgressions: PlayerProgression[] = Array.from(allPlayers).map(playerName => {
        const dataPoints = snapshots.map(snapshot => {
          const player = snapshot.players.find(p => p.playerName === playerName);
          return {
            analysisId: snapshot.id,
            analysisName: snapshot.name,
            date: snapshot.formattedRaidDate,
            averagePercentile: player?.averagePercentile || 0,
            wipefestScore: player?.wipefestScore || 0,
            totalAverage: player?.totalAverage || 0,
            present: !!player
          };
        });

        // Filter to only points where player was present
        const presentDataPoints = dataPoints.filter(dp => dp.present);
        
        if (presentDataPoints.length === 0) {
          return null;
        }

        const firstValue = presentDataPoints[0].totalAverage;
        const lastValue = presentDataPoints[presentDataPoints.length - 1].totalAverage;
        const totalChange = lastValue - firstValue;

        // Determine trend
        let overallTrend: 'improving' | 'declining' | 'stable' | 'new' | 'inconsistent';
        if (presentDataPoints.length === 1) {
          overallTrend = 'new';
        } else if (Math.abs(totalChange) <= 3) {
          overallTrend = 'stable';
        } else if (totalChange > 0) {
          // Check if it's consistently improving
          let improvementCount = 0;
          for (let i = 1; i < presentDataPoints.length; i++) {
            if (presentDataPoints[i].totalAverage >= presentDataPoints[i - 1].totalAverage) {
              improvementCount++;
            }
          }
          overallTrend = improvementCount >= presentDataPoints.length * 0.7 ? 'improving' : 'inconsistent';
        } else {
          // Check if it's consistently declining
          let declineCount = 0;
          for (let i = 1; i < presentDataPoints.length; i++) {
            if (presentDataPoints[i].totalAverage <= presentDataPoints[i - 1].totalAverage) {
              declineCount++;
            }
          }
          overallTrend = declineCount >= presentDataPoints.length * 0.7 ? 'declining' : 'inconsistent';
        }

        // Get class and spec from most recent appearance
        const lastPresent = presentDataPoints[presentDataPoints.length - 1];
        const playerInSnapshot = snapshots.find(s => s.id === lastPresent.analysisId)?.players.find(p => p.playerName === playerName);

        return {
          playerName,
          class: playerInSnapshot?.class || 'Unknown',
          spec: playerInSnapshot?.spec || null,
          dataPoints,
          overallTrend,
          totalChange,
          firstValue,
          lastValue
        };
      }).filter(Boolean) as PlayerProgression[];

      // Calculate raid progression
      const firstRaidAverage = snapshots[0].raidAverages.totalAverage;
      const lastRaidAverage = snapshots[snapshots.length - 1].raidAverages.totalAverage;
      const raidOverallChange = lastRaidAverage - firstRaidAverage;
      
      let raidTrend: 'improving' | 'declining' | 'stable';
      if (Math.abs(raidOverallChange) <= 2) {
        raidTrend = 'stable';
      } else {
        raidTrend = raidOverallChange > 0 ? 'improving' : 'declining';
      }

      setComparisonResult({
        snapshots,
        playerProgressions,
        raidProgression: {
          overallChange: raidOverallChange,
          trend: raidTrend
        }
      });

    } catch (error) {
      console.error('Error calculating comparison:', error);
    } finally {
      setComparing(false);
    }
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Improving</Badge>;
      case 'declining':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Declining</Badge>;
      case 'stable':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Stable</Badge>;
      case 'new':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">New</Badge>;
      case 'inconsistent':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Inconsistent</Badge>;
      default:
        return <Badge variant="outline">{trend}</Badge>;
    }
  };

  const getChangeDisplay = (change: number) => {
    if (change === 0) return '0%';
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change.toFixed(1)}%`;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading analyses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Compare Analyses</h1>
        <p className="text-muted-foreground">
          Select multiple analyses to see progression over time. They will be automatically sorted by actual raid dates (not upload dates).
        </p>
      </div>

      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Select Analyses to Compare
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bulk actions */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={selectAll}>
              <CheckSquare className="h-4 w-4 mr-2" />
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              <Square className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedAnalyses.size} of {analyses.length} selected
            </span>
          </div>

          {/* Analysis selection grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyses
              .sort((a, b) => new Date(a.dateRange.earliest).getTime() - new Date(b.dateRange.earliest).getTime())
              .map((analysis) => (
              <div
                key={analysis.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedAnalyses.has(analysis.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => toggleAnalysisSelection(analysis.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedAnalyses.has(analysis.id)}
                    onChange={() => toggleAnalysisSelection(analysis.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{analysis.name}</div>
                    <div className="text-sm text-muted-foreground">
                      <div>{analysis.zone}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(analysis.dateRange.earliest).toLocaleDateString()}
                        <span className="text-xs opacity-70">
                          (raid date)
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {analysis.reportCount} reports
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {analysis.playerCount} players
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button 
            onClick={calculateComparison}
            disabled={!canCompare || comparing}
            className="w-full"
          >
            {comparing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Calculating Progression...
              </>
            ) : (
              <>
                <GitCompare className="h-4 w-4 mr-2" />
                Compare Selected Analyses ({selectedAnalyses.size})
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Empty State */}
      {analyses.length < 2 && (
        <Card>
          <CardContent className="p-8 text-center">
            <GitCompare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Need More Analyses</h3>
            <p className="text-muted-foreground">
              You need at least 2 saved analyses to use the comparison feature. 
              Save some analyses first from the "Add Report" page.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Comparison Results */}
      {comparisonResult && (
        <div className="space-y-6">
          {/* Raid Progression Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Raid Progression Timeline</CardTitle>
              <p className="text-sm text-muted-foreground">
                Performance changes across {comparisonResult.snapshots.length} analyses
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comparisonResult.snapshots.map((snapshot, index) => (
                  <div key={snapshot.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium">#{index + 1}</div>
                      <div>
                        <div className="font-medium">{snapshot.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {snapshot.zone} • {snapshot.formattedRaidDate}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Raid Average</div>
                        <div className="font-bold text-lg">{snapshot.raidAverages.totalAverage}%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Players</div>
                        <div className="font-bold text-lg">{snapshot.raidAverages.playerCount}</div>
                      </div>
                      {index > 0 && (
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Change</div>
                          <div className="flex items-center gap-1 font-bold">
                            {getChangeIcon(snapshot.raidAverages.totalAverage - comparisonResult.snapshots[index - 1].raidAverages.totalAverage)}
                            {getChangeDisplay(snapshot.raidAverages.totalAverage - comparisonResult.snapshots[index - 1].raidAverages.totalAverage)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Overall raid progression summary */}
              <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Overall Raid Progression</div>
                    <div className="text-sm text-muted-foreground">
                      From {comparisonResult.snapshots[0].formattedRaidDate} to {comparisonResult.snapshots[comparisonResult.snapshots.length - 1].formattedRaidDate}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getTrendBadge(comparisonResult.raidProgression.trend)}
                    <div className="flex items-center gap-2 font-bold text-lg">
                      {getChangeIcon(comparisonResult.raidProgression.overallChange)}
                      {getChangeDisplay(comparisonResult.raidProgression.overallChange)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Player Progression Table */}
          <Card>
            <CardHeader>
              <CardTitle>Individual Player Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trend</th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Player</th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Spec</th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">First</th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Latest</th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Total Change</th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Analyses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonResult.playerProgressions
                      .sort((a, b) => b.totalChange - a.totalChange)
                      .map((player) => (
                      <tr key={player.playerName} className="border-b border-white/5 last:border-0">
                        <td className="py-3 text-sm">
                          {getTrendBadge(player.overallTrend)}
                        </td>
                        <td className="py-3 text-sm font-medium">
                          {player.playerName}
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {player.spec || 'Unknown'} {player.class}
                        </td>
                        <td className="py-3 text-sm text-right">
                          <span className="px-2 py-1 rounded-md bg-gray-500/20 text-gray-400">
                            {player.firstValue}%
                          </span>
                        </td>
                        <td className="py-3 text-sm text-right">
                          <span className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-400">
                            {player.lastValue}%
                          </span>
                        </td>
                        <td className="py-3 text-sm font-bold text-right">
                          <div className="flex items-center justify-end gap-1">
                            {getChangeIcon(player.totalChange)}
                            {getChangeDisplay(player.totalChange)}
                          </div>
                        </td>
                        <td className="py-3 text-sm text-right text-muted-foreground">
                          {player.dataPoints.filter(dp => dp.present).length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CompareAnalysesPage; 