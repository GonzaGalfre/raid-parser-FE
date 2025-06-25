import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Trophy, X, Skull, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BossStats {
  bossName: string;
  kills: number;
  wipes: number;
  totalAttempts: number;
  killRate: number;
  bestKillDuration?: string;
  worstWipePercentage?: number;
}

const BossesPage: React.FC = () => {
  const [bossStats, setBossStats] = useState<BossStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAnalyses, setTotalAnalyses] = useState(0);

  // Load all saved analyses and calculate boss statistics
  useEffect(() => {
    const loadAllBossStats = async () => {
      try {
        setLoading(true);
        
        // Import the analysis service
        const { analysisService } = await import('@/services/analysisService');
        
        // Get all saved analyses
        const allAnalyses = await analysisService.getAllAnalyses();
        setTotalAnalyses(allAnalyses.length);
        
        if (allAnalyses.length === 0) {
          setBossStats([]);
          return;
        }

        // Aggregate boss statistics from all analyses
        const bossStatsMap = new Map<string, {
          kills: number;
          wipes: number;
          killDurations: number[];
          wipePercentages: number[];
        }>();

        // Process all analyses
        for (const analysisMetadata of allAnalyses) {
          try {
            // Load the full analysis data
            const fullAnalysis = await analysisService.loadAnalysis(analysisMetadata.id);
            if (!fullAnalysis) continue;

            // Process each report in the analysis
            fullAnalysis.reportData.forEach((reportData: any) => {
              if (reportData.fightParses) {
                Object.entries(reportData.fightParses).forEach(([bossName, fightParse]: [string, any]) => {
                  if (!bossStatsMap.has(bossName)) {
                    bossStatsMap.set(bossName, {
                      kills: 0,
                      wipes: 0,
                      killDurations: [],
                      wipePercentages: []
                    });
                  }

                  const stats = bossStatsMap.get(bossName)!;

                  // Process all pulls for this boss
                  if (fightParse.pulls) {
                    fightParse.pulls.forEach((pull: any) => {
                      if (pull.isKill) {
                        stats.kills++;
                        // Convert duration string (like "3:45") to seconds for comparison
                        if (pull.duration) {
                          const parts = pull.duration.split(':');
                          const seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                          stats.killDurations.push(seconds);
                        }
                      } else {
                        stats.wipes++;
                        // Track wipe percentages (boss health remaining)
                        if (pull.fightDetails?.bossPercentage !== undefined) {
                          stats.wipePercentages.push(pull.fightDetails.bossPercentage);
                        }
                      }
                    });
                  }
                });
              }
            });
          } catch (error) {
            console.warn(`Failed to load analysis ${analysisMetadata.id}:`, error);
            // Continue with other analyses
          }
        }

        // Convert to array and calculate derived stats
        const calculatedStats = Array.from(bossStatsMap.entries()).map(([bossName, stats]) => {
          const totalAttempts = stats.kills + stats.wipes;
          const killRate = totalAttempts > 0 ? (stats.kills / totalAttempts) * 100 : 0;
          
          // Find best kill duration (shortest)
          let bestKillDuration: string | undefined;
          if (stats.killDurations.length > 0) {
            const bestSeconds = Math.min(...stats.killDurations);
            const minutes = Math.floor(bestSeconds / 60);
            const seconds = bestSeconds % 60;
            bestKillDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          }

          // Find worst wipe (highest boss percentage remaining)
          const worstWipePercentage = stats.wipePercentages.length > 0 
            ? Math.max(...stats.wipePercentages) 
            : undefined;

          return {
            bossName,
            kills: stats.kills,
            wipes: stats.wipes,
            totalAttempts,
            killRate,
            bestKillDuration,
            worstWipePercentage
          };
        }).sort((a, b) => {
          // Sort by kill rate (highest first), then by total attempts (most first)
          if (a.killRate !== b.killRate) {
            return b.killRate - a.killRate;
          }
          return b.totalAttempts - a.totalAttempts;
        });

        setBossStats(calculatedStats);
      } catch (error) {
        console.error('Error loading boss statistics:', error);
        setBossStats([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllBossStats();
  }, []);

  const hasData = bossStats.length > 0;

  // Calculate overall stats
  const totalKills = bossStats.reduce((sum, boss) => sum + boss.kills, 0);
  const totalWipes = bossStats.reduce((sum, boss) => sum + boss.wipes, 0);
  const totalAttempts = totalKills + totalWipes;
  const overallKillRate = totalAttempts > 0 ? (totalKills / totalAttempts) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-gradient mb-2">Boss Statistics</h1>
          <p className="text-muted-foreground">
            Loading boss statistics from all your saved analyses...
          </p>
        </header>

        <div className="glass-morphism p-8 rounded-lg text-center">
          <RefreshCw className="h-16 w-16 mx-auto mb-4 text-muted-foreground animate-spin" />
          <h2 className="text-2xl font-bold mb-4">Loading Boss Data</h2>
          <p className="text-muted-foreground">
            Analyzing all your saved raid reports...
          </p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-gradient mb-2">Boss Statistics</h1>
          <p className="text-muted-foreground">
            Comprehensive boss statistics across all your saved analyses
          </p>
        </header>

        <div className="glass-morphism p-8 rounded-lg text-center">
          <Crown className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-4">No Boss Data Available</h2>
          <p className="text-muted-foreground mb-4">
            {totalAnalyses === 0 
              ? "You don't have any saved analyses yet." 
              : `Found ${totalAnalyses} saved analyses, but no boss data could be extracted.`}
          </p>
          <p className="text-sm text-muted-foreground">
            Save some raid reports from the "Add Report" tab to see boss statistics here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gradient mb-2">Boss Statistics</h1>
        <p className="text-muted-foreground">
          Liberation of Undermine progression across all {totalAnalyses} saved analyses
        </p>
      </header>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttempts}</div>
            <p className="text-xs text-muted-foreground">
              Across all bosses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kills</CardTitle>
            <Trophy className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{totalKills}</div>
            <p className="text-xs text-muted-foreground">
              Successful kills
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wipes</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{totalWipes}</div>
            <p className="text-xs text-muted-foreground">
              Failed attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Skull className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallKillRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Overall kill rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Boss Statistics Table */}
      <div className="glass-morphism rounded-lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Individual Boss Statistics</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Boss</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Kills</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Wipes</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Total</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Success Rate</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Best Kill</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Worst Wipe</th>
                </tr>
              </thead>
              <tbody>
                {bossStats.map((boss, index) => (
                  <tr key={boss.bossName} className="border-b border-white/5 last:border-0">
                    <td className="py-4">
                      <div className="flex items-center">
                        <Crown className="h-5 w-5 mr-3 text-yellow-500" />
                        <div>
                          <div className="font-medium">{boss.bossName}</div>
                          <div className="text-sm text-muted-foreground">
                            #{index + 1} by success rate
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                        <Trophy className="h-3 w-3 mr-1" />
                        {boss.kills}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                        <X className="h-3 w-3 mr-1" />
                        {boss.wipes}
                      </span>
                    </td>
                    <td className="py-4 text-center text-sm font-medium">
                      {boss.totalAttempts}
                    </td>
                    <td className="py-4 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          boss.killRate >= 80 ? "bg-green-500/20 text-green-400" :
                          boss.killRate >= 60 ? "bg-blue-500/20 text-blue-400" :
                          boss.killRate >= 40 ? "bg-yellow-500/20 text-yellow-400" :
                          boss.killRate >= 20 ? "bg-orange-500/20 text-orange-400" :
                          "bg-red-500/20 text-red-400"
                        )}
                      >
                        {boss.killRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-4 text-center text-sm">
                      {boss.bestKillDuration || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-4 text-center text-sm">
                      {boss.worstWipePercentage !== undefined ? (
                        <span className="text-red-400">
                          {Math.round(boss.worstWipePercentage)}% left
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Additional insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Difficult Boss */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-400">
              <Skull className="h-5 w-5 mr-2" />
              Most Difficult Boss
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const hardestBoss = bossStats.reduce((prev, current) => 
                current.killRate < prev.killRate ? current : prev
              );
              return (
                <div>
                  <div className="text-2xl font-bold mb-2">{hardestBoss.bossName}</div>
                  <div className="text-sm text-muted-foreground">
                    {hardestBoss.killRate.toFixed(1)}% success rate ({hardestBoss.kills} kills, {hardestBoss.wipes} wipes)
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Easiest Boss */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-400">
              <Trophy className="h-5 w-5 mr-2" />
              Most Farmed Boss
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const easiestBoss = bossStats.reduce((prev, current) => 
                current.killRate > prev.killRate ? current : prev
              );
              return (
                <div>
                  <div className="text-2xl font-bold mb-2">{easiestBoss.bossName}</div>
                  <div className="text-sm text-muted-foreground">
                    {easiestBoss.killRate.toFixed(1)}% success rate ({easiestBoss.kills} kills, {easiestBoss.wipes} wipes)
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BossesPage; 