import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Database, TrendingUp, Users, Calendar, Activity, GitCompare, Trophy, Star, BarChart3, Brain } from 'lucide-react';
import { analysisService } from '../services/analysisService';
import { AnalysisMetadata } from '../types/storage';
import AIReportDialog from './AIReportDialog';
import { useTimelineAnalysis } from '../hooks/useTimelineAnalysis';

interface HubPageProps {
  onNavigate: (page: 'add-report' | 'saved-reports' | 'compare') => void;
  onLoadAnalysis?: (analysisId: string) => void;
}

interface TopPlayer {
  playerName: string;
  class: string;
  spec: string | null;
  averagePerformance: number;
  totalParses: number;
  bestParse: number;
  analysisName: string;
}

const HubPage: React.FC<HubPageProps> = ({ onNavigate, onLoadAnalysis }) => {
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisMetadata[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [averageRaidPerformance, setAverageRaidPerformance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // AI Report functionality
  const { timelineAnalysis, analysisMetadata } = useTimelineAnalysis();

  useEffect(() => {
    const loadHubData = async () => {
      try {
        const [analyses, storageStats] = await Promise.all([
          analysisService.getAllAnalyses(),
          analysisService.getStorageStats()
        ]);
        
        // Show only the 3 most recent analyses
        setRecentAnalyses(analyses.slice(0, 3));
        setStats(storageStats);

        // Calculate top performers across all analyses
        await calculateTopPlayers(analyses);

        // Calculate average raid performance across all analyses
        await calculateAverageRaidPerformance(analyses);
      } catch (error) {
        console.error('Error loading hub data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHubData();
  }, []);

  const calculateTopPlayers = async (analyses: AnalysisMetadata[]) => {
    try {
      if (analyses.length === 0) {
        setTopPlayers([]);
        return;
      }

      // Load all analyses to get player data
      const allAnalyses = await Promise.all(
        analyses.map(analysis => analysisService.loadAnalysis(analysis.id))
      );

      // Aggregate player performance across all analyses
      const playerMap = new Map<string, {
        playerName: string;
        class: string;
        spec: string | null;
        totalPerformance: number;
        parseCount: number;
        bestParse: number;
        bestAnalysisName: string;
      }>();

      allAnalyses.forEach((analysis, index) => {
        if (analysis && analysis.players) {
          analysis.players.forEach((player: any) => {
            const key = `${player.playerName}-${player.class}`;
            const existing = playerMap.get(key);
            
            if (existing) {
              existing.totalPerformance += player.totalAverage;
              existing.parseCount += 1;
              if (player.totalAverage > existing.bestParse) {
                existing.bestParse = player.totalAverage;
                existing.bestAnalysisName = analysis.name;
              }
            } else {
              playerMap.set(key, {
                playerName: player.playerName,
                class: player.class,
                spec: player.spec,
                totalPerformance: player.totalAverage,
                parseCount: 1,
                bestParse: player.totalAverage,
                bestAnalysisName: analysis.name
              });
            }
          });
        }
      });

      // Convert to sorted array of top performers
      const topPerformers = Array.from(playerMap.values())
        .map(player => ({
          playerName: player.playerName,
          class: player.class,
          spec: player.spec,
          averagePerformance: player.parseCount > 0 ? Math.round(player.totalPerformance / player.parseCount) : 0,
          totalParses: player.parseCount,
          bestParse: player.bestParse,
          analysisName: player.bestAnalysisName
        }))
        .sort((a, b) => b.averagePerformance - a.averagePerformance)
        .slice(0, 5); // Top 5 players

      setTopPlayers(topPerformers);
    } catch (error) {
      console.error('Error calculating top players:', error);
      setTopPlayers([]);
    }
  };

  const calculateAverageRaidPerformance = async (analyses: AnalysisMetadata[]) => {
    try {
      if (analyses.length === 0) {
        setAverageRaidPerformance(0);
        return;
      }

      // Simply use the averagePerformance from metadata (which is already calculated)
      const validAnalyses = analyses.filter(analysis => !isNaN(analysis.averagePerformance));
      if (validAnalyses.length === 0) {
        setAverageRaidPerformance(0);
        return;
      }
      
      const totalPerformance = validAnalyses.reduce((sum, analysis) => sum + analysis.averagePerformance, 0);
      const avgRaidPerformance = Math.round(totalPerformance / validAnalyses.length);
      
      setAverageRaidPerformance(avgRaidPerformance);
    } catch (error) {
      console.error('Error calculating average raid performance:', error);
      setAverageRaidPerformance(0);
    }
  };

  const handleLoadAnalysis = async (id: string) => {
    if (onLoadAnalysis) {
      onLoadAnalysis(id);
    } else {
      // Fallback for when onLoadAnalysis is not provided
      try {
        const analysis = await analysisService.loadAnalysis(id);
        console.log('Loading analysis:', analysis);
        alert('Analysis loading will be implemented in the next step!');
      } catch (error) {
        console.error('Error loading analysis:', error);
      }
    }
  };

  const getClassColor = (className: string) => {
    const classColors: Record<string, string> = {
      'Death Knight': 'text-red-400',
      'Demon Hunter': 'text-purple-400',
      'Druid': 'text-orange-400',
      'Evoker': 'text-green-400',
      'Hunter': 'text-green-400',
      'Mage': 'text-cyan-400',
      'Monk': 'text-green-400',
      'Paladin': 'text-pink-400',
      'Priest': 'text-white',
      'Rogue': 'text-yellow-400',
      'Shaman': 'text-blue-400',
      'Warlock': 'text-purple-400',
      'Warrior': 'text-yellow-600'
    };
    return classColors[className] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 animate-pulse" />
          <span>Loading hub data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome to Raid Parser</h1>
        <p className="text-muted-foreground">
          Your WoW raid performance analysis hub. Import reports, analyze performance, and track progression.
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalAnalyses || 0}</p>
                <p className="text-sm text-muted-foreground">Saved Analyses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{averageRaidPerformance}%</p>
                <p className="text-sm text-muted-foreground">Average Raid Performance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats?.newestAnalysis ? 
                    new Date(stats.newestAnalysis).toLocaleDateString() : 
                    'No data'
                  }
                </p>
                <p className="text-sm text-muted-foreground">Latest Analysis</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Import New Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Add a new WarcraftLogs report to analyze raid performance and player statistics.
            </p>
            <Button onClick={() => onNavigate('add-report')} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Start Analysis
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Browse Saved Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              View, load, and manage your previously saved raid analyses and compare performance over time.
            </p>
            <Button onClick={() => onNavigate('saved-reports')} variant="outline" className="w-full">
              <Database className="h-4 w-4 mr-2" />
              View All Analyses
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Compare Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Compare multiple analyses to see performance changes and progression between raids.
            </p>
            <Button 
              onClick={() => onNavigate('compare')} 
              variant="outline" 
              className="w-full"
              disabled={stats?.totalAnalyses < 2}
            >
              <GitCompare className="h-4 w-4 mr-2" />
              {stats?.totalAnalyses < 2 ? 'Need 2+ Analyses' : 'Compare Performance'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Report Generator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Generate intelligent insights about raid performance, player improvements, and attendance patterns.
            </p>
            <AIReportDialog 
              timelineAnalysis={timelineAnalysis}
              analysisMetadata={analysisMetadata}
              disabled={!timelineAnalysis || timelineAnalysis.summary.totalReports < 2}
            />
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      {topPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Performers (All Analyses)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Best average performance across all stored raid analyses
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPlayers.map((player, index) => (
                <div 
                  key={`${player.playerName}-${player.class}`}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index === 0 ? <Trophy className="h-4 w-4" /> : index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${getClassColor(player.class)}`}>
                          {player.playerName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {player.spec || 'Unknown'} {player.class}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {player.totalParses} parse{player.totalParses !== 1 ? 's' : ''} • Best: {player.bestParse}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{player.averagePerformance}%</div>
                    <div className="text-xs text-muted-foreground">Average</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Analyses */}
      {recentAnalyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAnalyses.map((analysis) => (
                <div 
                  key={analysis.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{analysis.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {analysis.zone}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {analysis.reportCount} reports • {analysis.playerCount} players • 
                      Avg: {isNaN(analysis.averagePerformance) ? 'N/A' : analysis.averagePerformance.toFixed(1)} • 
                      {new Date(analysis.dateRange.earliest).toLocaleDateString()}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleLoadAnalysis(analysis.id)}
                  >
                    Load
                  </Button>
                </div>
              ))}
            </div>
            
            {recentAnalyses.length >= 3 && (
              <div className="mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => onNavigate('saved-reports')}
                  className="w-full"
                >
                  View All Saved Analyses
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {recentAnalyses.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analyses Yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by importing your first WarcraftLogs report to analyze raid performance.
            </p>
            <Button onClick={() => onNavigate('add-report')}>
              <Plus className="h-4 w-4 mr-2" />
              Import First Report
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HubPage; 