
// src/hooks/useWarcraftLogs.ts
import { useState, useEffect, useCallback } from 'react';
import {
  fetchSingleReport,
  fetchAttendanceData,
  type ReportData,
  type PlayerAverage,
  type WipefestScore,
  type AttendanceData,
} from '@/services/warcraftLogsApi';

export const useWarcraftLogsReports = (initialReportCodes: string[], apiKey: string, targetZone: string, forceRefresh?: number) => {
  const [reportCodes, setReportCodes] = useState<string[]>(initialReportCodes.filter(Boolean));
  const [reportsData, setReportsData] = useState<Record<string, ReportData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (reportCodes.length === 0 || !apiKey) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newReportsData: Record<string, ReportData> = {};
      for (const reportCode of reportCodes) {
        if (!reportCode) continue;

        const reportData = await fetchSingleReport(reportCode, apiKey, targetZone);
        if (reportData) {
          newReportsData[reportCode] = reportData;
        }
      }
      setReportsData(newReportsData);
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [reportCodes, apiKey, targetZone]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports, forceRefresh]);

  const updateReportCodes = (newCodes: string[]) => {
    setReportCodes(newCodes.filter(Boolean));
  };

  const setSelectedFight = (reportCode: string, fightName: string) => {
    if (reportsData[reportCode]) {
      setReportsData(prevData => ({
        ...prevData,
        [reportCode]: {
          ...prevData[reportCode],
          selectedFight: fightName,
        },
      }));
    }
  };

  return {
    loading,
    error,
    reportsData,
    updateReportCodes,
    setSelectedFight,
    fetchReports,
  };
};

export const useWarcraftLogsAnalysis = (reportsData: Record<string, ReportData>, wipefestScores: WipefestScore) => {
  const countTotalPulls = (reportCodesToCount: string[]): number => {
    let totalPulls = 0;
    reportCodesToCount.forEach(reportCode => {
      const report = reportsData[reportCode];
      if (report) {
        Object.values(report.fightParses).forEach(fight => {
          totalPulls += fight.pulls.length;
        });
      }
    });
    return totalPulls;
  };

  const calculatePlayerAverages = (reportCode: string): PlayerAverage[] => {
    const reportData = reportsData[reportCode];
    if (!reportData || Object.keys(reportData.fightParses).length === 0) return [];

    const playerParses: Record<string, {
      playerName: string,
      class: string,
      spec: string | null,
      parses: number[]
    }> = {};

    let totalPulls = 0;
    let playerAttendance: Record<string, number> = {};

    if (reportData.attendanceData) {
      totalPulls = reportData.attendanceData.totalPulls;
      playerAttendance = reportData.attendanceData.playerAttendance;
    } else {
      totalPulls = countTotalPulls([reportCode]);
      Object.values(reportData.fightParses).forEach(fight => {
        fight.pulls.forEach(pull => {
          const playersInPull = new Set(pull.parses.map(parse => parse.playerName));
          playersInPull.forEach(playerName => {
            playerAttendance[playerName] = (playerAttendance[playerName] || 0) + 1;
          });
        });
      });
    }

    Object.values(reportData.fightParses).forEach(fight => {
      fight.parses.forEach(parse => {
        const playerKey = parse.playerName;
        if (!playerParses[playerKey]) {
          playerParses[playerKey] = {
            playerName: parse.playerName,
            class: parse.class,
            spec: parse.spec,
            parses: []
          };
        }
        playerParses[playerKey].parses.push(parse.percentile);
      });
    });

    const playerAverages = Object.values(playerParses).map(player => {
      const average = player.parses.reduce((sum, val) => sum + val, 0) / player.parses.length;
      const wipefestScore = wipefestScores[player.playerName] || 0;
      const totalAverage = Math.round((Math.round(average) + wipefestScore) / 2);

      return {
        ...player,
        averagePercentile: Math.round(average),
        totalParses: player.parses.length,
        wipefestScore,
        totalAverage,
        attendance: {
          present: playerAttendance[player.playerName] || 0,
          total: totalPulls
        }
      };
    });

    return playerAverages.sort((a, b) => b.totalAverage - a.totalAverage);
  };

  const calculateMergedPlayerAverages = (): PlayerAverage[] => {
    if (Object.keys(reportsData).length === 0) return [];

    const playerParses: Record<string, {
      playerName: string,
      class: string,
      spec: string | null,
      parses: number[]
    }> = {};

    let totalPulls = 0;
    const playerAttendance: Record<string, number> = {};

    Object.values(reportsData).forEach(reportData => {
      if (reportData.attendanceData) {
        totalPulls += reportData.attendanceData.totalPulls;
        Object.entries(reportData.attendanceData.playerAttendance).forEach(([playerName, count]) => {
          playerAttendance[playerName] = (playerAttendance[playerName] || 0) + count;
        });
      } else {
        Object.values(reportData.fightParses).forEach(fight => {
          totalPulls += fight.pulls.length;
          fight.pulls.forEach(pull => {
            const playersInPull = new Set(pull.parses.map(parse => parse.playerName));
            playersInPull.forEach(playerName => {
              playerAttendance[playerName] = (playerAttendance[playerName] || 0) + 1;
            });
          });
        });
      }

      Object.values(reportData.fightParses).forEach(fight => {
        fight.parses.forEach(parse => {
          const playerKey = parse.playerName;
          if (!playerParses[playerKey]) {
            playerParses[playerKey] = {
              playerName: parse.playerName,
              class: parse.class,
              spec: parse.spec,
              parses: []
            };
          }
          playerParses[playerKey].parses.push(parse.percentile);
        });
      });
    });

    const playerAverages = Object.values(playerParses).map(player => {
      const average = player.parses.reduce((sum, val) => sum + val, 0) / player.parses.length;
      const wipefestScore = wipefestScores[player.playerName] || 0;
      const totalAverage = Math.round((Math.round(average) + wipefestScore) / 2);

      return {
        ...player,
        averagePercentile: Math.round(average),
        totalParses: player.parses.length,
        wipefestScore,
        totalAverage,
        attendance: {
          present: playerAttendance[player.playerName] || 0,
          total: totalPulls
        }
      };
    });

    return playerAverages.sort((a, b) => b.totalAverage - a.totalAverage);
  };

  const calculateReportComparison = (baselineReportId: string, compareReportId: string) => {
    const baselineData = reportsData[baselineReportId];
    const compareData = reportsData[compareReportId];

    if (!baselineData || !compareData) {
      return null;
    }

    const baselineAverages = calculatePlayerAverages(baselineReportId);
    const compareAverages = calculatePlayerAverages(compareReportId);

    const baselineMap = new Map(baselineAverages.map(p => [p.playerName, p]));
    const compareMap = new Map(compareAverages.map(p => [p.playerName, p]));

    const allPlayers = new Set([...baselineMap.keys(), ...compareMap.keys()]);

    const playerComparisons = Array.from(allPlayers).map(playerName => {
      const baseline = baselineMap.get(playerName);
      const compare = compareMap.get(playerName);

      let status: 'improved' | 'decreased' | 'stable' | 'new' | 'missing';
      let changes = {
        averagePercentileChange: 0,
        wipefestScoreChange: 0,
        totalAverageChange: 0
      };

      if (!baseline && compare) {
        status = 'new';
      } else if (baseline && !compare) {
        status = 'missing';
      } else if (baseline && compare) {
        changes = {
          averagePercentileChange: compare.averagePercentile - baseline.averagePercentile,
          wipefestScoreChange: compare.wipefestScore - baseline.wipefestScore,
          totalAverageChange: compare.totalAverage - baseline.totalAverage
        };

        const totalChange = Math.abs(changes.totalAverageChange);
        if (totalChange <= 2) {
          status = 'stable';
        } else if (changes.totalAverageChange > 0) {
          status = 'improved';
        } else {
          status = 'decreased';
        }
      } else {
        status = 'stable';
      }

      return {
        playerName,
        class: (compare || baseline)?.class || 'Unknown',
        spec: (compare || baseline)?.spec || null,
        previousReport: baseline ? {
          averagePercentile: baseline.averagePercentile,
          wipefestScore: baseline.wipefestScore,
          totalAverage: baseline.totalAverage
        } : null,
        currentReport: compare ? {
          averagePercentile: compare.averagePercentile,
          wipefestScore: compare.wipefestScore,
          totalAverage: compare.totalAverage
        } : null,
        changes,
        status
      };
    });

    return {
      baselineReportId,
      compareReportId,
      baselineTitle: baselineData.reportTitle,
      compareTitle: compareData.reportTitle,
      playerComparisons
    };
  };

  const calculateTimelineAnalysis = () => {
    const reportIds = Object.keys(reportsData);
    if (reportIds.length < 2) return null;

    const sortedReports = reportIds
      .map(id => ({ id, data: reportsData[id] }))
      .filter(report => report.data.startTime > 0)
      .sort((a, b) => a.data.startTime - b.data.startTime);

    if (sortedReports.length < 2) return null;

    const reportSnapshots = sortedReports.map(({ id, data }) => {
      const playerAverages = calculatePlayerAverages(id);
      const raidAverages = {
        averagePercentile: Math.round(
          playerAverages.reduce((sum, p) => sum + p.averagePercentile, 0) / playerAverages.length
        ),
        wipefestScore: Math.round(
          playerAverages.reduce((sum, p) => sum + p.wipefestScore, 0) / playerAverages.length
        ),
        totalAverage: Math.round(
          playerAverages.reduce((sum, p) => sum + p.totalAverage, 0) / playerAverages.length
        ),
        playerCount: playerAverages.length
      };

      const playerAveragesLookup = playerAverages.reduce((acc, player) => {
        acc[player.playerName] = {
          averagePercentile: player.averagePercentile,
          wipefestScore: player.wipefestScore,
          totalAverage: player.totalAverage,
          class: player.class,
          spec: player.spec
        };
        return acc;
      }, {} as Record<string, any>);

      return {
        reportId: id,
        reportTitle: data.reportTitle,
        startTime: data.startTime,
        formattedDate: new Date(data.startTime).toLocaleString(),
        raidAverages,
        playerAverages: playerAveragesLookup
      };
    });

    const allPlayers = new Set<string>();
    reportSnapshots.forEach(snapshot => {
      Object.keys(snapshot.playerAverages).forEach(playerName => {
        allPlayers.add(playerName);
      });
    });

    const playerProgressions = Array.from(allPlayers).map(playerName => {
      const dataPoints = reportSnapshots
        .filter(snapshot => snapshot.playerAverages[playerName])
        .map(snapshot => ({
          reportId: snapshot.reportId,
          reportTitle: snapshot.reportTitle,
          date: snapshot.formattedDate,
          averagePercentile: snapshot.playerAverages[playerName].averagePercentile,
          wipefestScore: snapshot.playerAverages[playerName].wipefestScore,
          totalAverage: snapshot.playerAverages[playerName].totalAverage
        }));

      if (dataPoints.length === 0) return null;

      const firstAverage = dataPoints[0].totalAverage;
      const lastAverage = dataPoints[dataPoints.length - 1].totalAverage;
      const totalChange = lastAverage - firstAverage;

      let overallTrend: 'improving' | 'declining' | 'stable' | 'inconsistent';
      if (Math.abs(totalChange) <= 3) {
        overallTrend = 'stable';
      } else if (totalChange > 0) {
        let improvementCount = 0;
        for (let i = 1; i < dataPoints.length; i++) {
          if (dataPoints[i].totalAverage >= dataPoints[i - 1].totalAverage) {
            improvementCount++;
          }
        }
        overallTrend = improvementCount >= dataPoints.length * 0.7 ? 'improving' : 'inconsistent';
      } else {
        let declineCount = 0;
        for (let i = 1; i < dataPoints.length; i++) {
          if (dataPoints[i].totalAverage <= dataPoints[i - 1].totalAverage) {
            declineCount++;
          }
        }
        overallTrend = declineCount >= dataPoints.length * 0.7 ? 'declining' : 'inconsistent';
      }

      const firstDataPoint = dataPoints[0];
      return {
        playerName,
        class: firstDataPoint ? (reportSnapshots.find(s => s.playerAverages[playerName])?.playerAverages[playerName]?.class || 'Unknown') : 'Unknown',
        spec: firstDataPoint ? (reportSnapshots.find(s => s.playerAverages[playerName])?.playerAverages[playerName]?.spec || null) : null,
        dataPoints,
        overallTrend,
        totalChange,
        firstReportAverage: firstAverage,
        lastReportAverage: lastAverage
      };
    }).filter(Boolean) as any[];

    const firstRaidAverage = reportSnapshots[0].raidAverages.totalAverage;
    const lastRaidAverage = reportSnapshots[reportSnapshots.length - 1].raidAverages.totalAverage;
    const raidOverallChange = lastRaidAverage - firstRaidAverage;

    let raidTrend: 'improving' | 'declining' | 'stable';
    if (Math.abs(raidOverallChange) <= 2) {
      raidTrend = 'stable';
    } else {
      raidTrend = raidOverallChange > 0 ? 'improving' : 'declining';
    }

    const summary = {
      totalReports: reportSnapshots.length,
      dateRange: {
        start: reportSnapshots[0].formattedDate,
        end: reportSnapshots[reportSnapshots.length - 1].formattedDate
      },
      playersImproving: playerProgressions.filter(p => p.overallTrend === 'improving').length,
      playersStable: playerProgressions.filter(p => p.overallTrend === 'stable').length,
      playersDeclining: playerProgressions.filter(p => p.overallTrend === 'declining').length,
      averageRaidImprovement: raidOverallChange
    };

    return {
      raidTrend,
      overallChange: raidOverallChange,
      reportSnapshots,
      playerProgressions,
      summary
    };
  };

  return {
    calculatePlayerAverages,
    calculateMergedPlayerAverages,
    calculateReportComparison,
    calculateTimelineAnalysis,
  };
};
