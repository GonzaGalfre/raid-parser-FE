// src/services/warcraftLogsApi.ts
import { useState, useEffect, useCallback } from 'react';

// Types
export interface Player {
  name: string;
  server: string;
  region: string;
  class: string;
  spec: string | null;
}

export interface Parse {
  playerName: string;
  percentile: number;
  spec: string;
  class: string;
  isHealingParse?: boolean;
}

export interface Pull {
  id: number;
  attempt: number;
  startTime: number;
  endTime: number;
  isKill: boolean;
  duration: string;
  date: string;
  parses: Parse[];
  fightDetails?: {
    bossPercentage: number;
  };
}

export interface FightParse {
  parses: Parse[];
  fightId: number;
  fightDetails: any;
  pulls: Pull[];
}

// New interface to store attendance data
export interface AttendanceData {
  playerAttendance: Record<string, number>;
  totalPulls: number;
}

export interface ReportData {
  reportCode: string;
  reportTitle: string;
  startTime: number;
  players: Player[];
  fightParses: Record<string, FightParse>;
  selectedFight: string;
  loading: boolean;
  error: string | null;
  attendanceData?: AttendanceData; // Add attendance data to the report
}

export interface WipefestScore {
  [playerName: string]: number;
}

export interface PlayerAverage {
  playerName: string;
  class: string;
  spec: string | null;
  parses: number[];
  averagePercentile: number;
  totalParses: number;
  wipefestScore: number;
  totalAverage: number;
  // Updated attendance field
  attendance?: {
    present: number;
    total: number;
  };
}

export const useWarcraftLogsApi = (initialReportCodes: string[], apiKey: string, targetZone: string, forceRefresh?: number) => {
  const [reportCodes, setReportCodes] = useState<string[]>(initialReportCodes.filter(Boolean));
  const [reportsData, setReportsData] = useState<Record<string, ReportData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wipefestScores, setWipefestScores] = useState<WipefestScore>({});
  
  // Class color utility function
  const getClassColor = (className: string): string => {
    const classColors: Record<string, string> = {
      'DeathKnight': '#C41E3A',
      'DemonHunter': '#A330C9',
      'Death Knight': '#C41E3A',
      'Demon Hunter': '#A330C9',
      'Druid': '#FF7C0A',
      'Hunter': '#AAD372',
      'Mage': '#3FC7EB',
      'Monk': '#00FF98',
      'Paladin': '#F48CBA',
      'Priest': '#FFFFFF',
      'Rogue': '#FFF468',
      'Shaman': '#0070DD',
      'Warlock': '#8788EE',
      'Warrior': '#C69B6D',
      'Evoker': '#33937F',
      'NPC': '#999999',
      'Pet': '#999999'
    };
    
    return classColors[className] || '#888888';
  };

  // Format time
  const formatTime = (timeInMs: number): string => {
    if (!timeInMs || isNaN(timeInMs)) return '00:00';
    
    const seconds = Math.floor(timeInMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Get percentile badge variant
  const getPercentileBadgeVariant = (percentile: number): string => {
    if (percentile >= 95) return 'destructive'; // Legendary
    if (percentile >= 75) return 'outline';     // Epic
    if (percentile >= 50) return 'secondary';   // Rare
    if (percentile >= 25) return 'default';     // Uncommon
    return 'secondary';                         // Common
  };

  // Import wipefest scores from CSV
  const importWipefestScores = (csvText: string) => {
    if (!csvText.trim()) return;
    
    const newScores: WipefestScore = { ...wipefestScores };
    const lines = csvText.split('\n');
    
    // Skip header row if it exists (assumes first line is header)
    const startIdx = lines[0].toLowerCase().includes('player') && lines[0].toLowerCase().includes('parse') ? 1 : 0;
    
    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',');
      if (parts.length >= 2) {
        const playerName = parts[0].trim();
        const parseValue = parseInt(parts[1].trim(), 10);
        
        if (playerName && !isNaN(parseValue)) {
          newScores[playerName] = parseValue;
        }
      }
    }
    
    setWipefestScores(newScores);
  };

  // NEW: Function to fetch attendance data
  const fetchAttendanceData = async (reportCode: string): Promise<AttendanceData | null> => {
    if (!reportCode || !apiKey) return null;
    
    try {
      // Prepare GraphQL query specifically for attendance data
      const attendanceQuery = `
      query {
        reportData {
          report(code: "${reportCode}") {
            fights {
              id
              friendlyPlayers
            }
            masterData {
              actors {
                id
                name
                server
                type
              }
            }
          }
        }
      }`;

      // Make the GraphQL request
      const response = await fetch('https://www.warcraftlogs.com/api/v2/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ query: attendanceQuery })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error while fetching attendance: ${response.status}`);
      }

      const responseJson = await response.json();
      
      // Check for GraphQL errors
      if (responseJson.errors) {
        throw new Error(`GraphQL error: ${responseJson.errors[0].message}`);
      }

      const reportData = responseJson.data.reportData.report;
      
      if (!reportData) {
        throw new Error("No report data found");
      }
      
      // Process attendance data
      const playerAttendance: Record<string, number> = {};
      const actorsMap: Record<number, {name: string, server: string}> = {};
      
      // First, map actor IDs to player names
      if (reportData.masterData && reportData.masterData.actors) {
        reportData.masterData.actors.forEach((actor: any) => {
          if (actor.type === "Player") {
            actorsMap[actor.id] = {
              name: actor.name,
              server: actor.server
            };
          }
        });
      }
      
      // Count attendance for each fight
      let totalPulls = 0;
      if (reportData.fights) {
        totalPulls = reportData.fights.length;
        
        reportData.fights.forEach((fight: any) => {
          if (fight.friendlyPlayers) {
            fight.friendlyPlayers.forEach((playerId: number) => {
              const player = actorsMap[playerId];
              if (player) {
                const playerKey = player.name;
                playerAttendance[playerKey] = (playerAttendance[playerKey] || 0) + 1;
              }
            });
          }
        });
      }
      
      return { 
        playerAttendance,
        totalPulls
      };
      
    } catch (err: any) {
      console.error('Error fetching attendance data:', err);
      return null;
    }
  };

  // Calculate player averages for a specific report
  const calculatePlayerAverages = (reportCode: string): PlayerAverage[] => {
    const reportData = reportsData[reportCode];
    if (!reportData || Object.keys(reportData.fightParses).length === 0) return [];
    
    // Collect all parse entries for each player
    const playerParses: Record<string, {
      playerName: string,
      class: string,
      spec: string | null,
      parses: number[]
    }> = {};
    
    // Use attendance data if available from the report
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
    
    // Collect parses
    Object.values(reportData.fightParses).forEach(fight => {
      fight.parses.forEach(parse => {
        // Use only player name as key to merge specs
        const playerKey = parse.playerName;
        if (!playerParses[playerKey]) {
          playerParses[playerKey] = {
            playerName: parse.playerName,
            class: parse.class,
            spec: parse.spec, // Will use the most recent spec
            parses: []
          };
        }
        
        playerParses[playerKey].parses.push(parse.percentile);
      });
    });
    
    // Calculate averages for each player
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
    
    // Sort by total average if available, otherwise by parse percentile (highest first)
    return playerAverages.sort((a, b) => b.totalAverage - a.totalAverage);
  };

  // Count total pulls across specified reports
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

  // Calculate player averages across all reports
  const calculateMergedPlayerAverages = (): PlayerAverage[] => {
    // If no reports data is available, return empty array
    if (Object.keys(reportsData).length === 0) return [];
    
    // Collect all parse entries for each player across all reports
    const playerParses: Record<string, {
      playerName: string,
      class: string,
      spec: string | null,
      parses: number[]
    }> = {};
    
    // Collect attendance data across all reports
    let totalPulls = 0;
    const playerAttendance: Record<string, number> = {};
    
    // Process all reports to gather attendance data
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
      
      // Process all fights in each report for parses
      Object.values(reportData.fightParses).forEach(fight => {
        // Collect parses
        fight.parses.forEach(parse => {
          // Use only player name as key to merge specs
          const playerKey = parse.playerName;
          if (!playerParses[playerKey]) {
            playerParses[playerKey] = {
              playerName: parse.playerName,
              class: parse.class,
              spec: parse.spec, // Will use the most recent spec
              parses: []
            };
          }
          
          playerParses[playerKey].parses.push(parse.percentile);
        });
      });
    });
    
    // Calculate averages for each player
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
    
    // Sort by total average (highest first)
    return playerAverages.sort((a, b) => b.totalAverage - a.totalAverage);
  };

  // Update selected fight for a specific report
  const setSelectedFight = (reportCode: string, fightName: string) => {
    if (reportsData[reportCode]) {
      setReportsData(prevData => ({
        ...prevData,
        [reportCode]: {
          ...prevData[reportCode],
          selectedFight: fightName
        }
      }));
    }
  };

  // Fetch a single report data using v2 GraphQL API
  const fetchSingleReport = async (reportCode: string): Promise<ReportData | null> => {
    if (!reportCode || !apiKey) return null;
    
    try {
      // Prepare GraphQL query
      const reportQuery = `
      query {
        reportData {
          report(code: "${reportCode}") {
            title
            startTime
            endTime
            zone {
              id
              name
            }
            fights {
              id
              name
              startTime
              endTime
              kill
              bossPercentage
              fightPercentage
              difficulty
              averageItemLevel
              gameZone {
                id
                name
              }
            }
            dpsRankings: rankings(playerMetric: dps)
            hpsRankings: rankings(playerMetric: hps)
            masterData {
              actors {
                id
                name
                server
                subType
                type
              }
            }
          }
        }
      }`;

      // Make the GraphQL request
      const graphqlResponse = await fetch('https://www.warcraftlogs.com/api/v2/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}` // Note: API key format has changed for v2
        },
        body: JSON.stringify({ query: reportQuery })
      });
      
      if (!graphqlResponse.ok) {
        throw new Error(`HTTP error while fetching report: ${graphqlResponse.status}`);
      }

      const responseJson = await graphqlResponse.json();
      
      // Check for GraphQL errors
      if (responseJson.errors) {
        throw new Error(`GraphQL error: ${responseJson.errors[0].message}`);
      }

      const reportData = responseJson.data.reportData.report;
      
      if (!reportData) {
        throw new Error("No report data found");
      }
      
      const reportTitle = reportData.title || 'Warcraft Logs Report';
      
      // Filter fights to only include those from the target zone
      const raidFights = reportData.fights.filter((fight: any) => 
        fight.gameZone?.name === targetZone && fight.name !== ""
      );
      
      // Extract players from masterData
      const extractedPlayers = new Map<string, Player>();
      
      // Process actors from masterData
      if (reportData.masterData && reportData.masterData.actors) {
        reportData.masterData.actors.forEach((actor: any) => {
          // Only include character actors (not pets or NPCs)
          if (actor.type === "Player") {
            const playerKey = `${actor.name}-${actor.server}`;
            if (!extractedPlayers.has(playerKey)) {
              extractedPlayers.set(playerKey, {
                name: actor.name,
                server: actor.server,
                region: "US", // Default as API doesn't always provide this
                class: actor.subType,
                spec: null // Will be updated from rankings if available
              });
            }
          }
        });
      }
      
      // Parse the rankings data
      let dpsRankings;
      let hpsRankings;
      
      try {
        // Rankings come as a JSON string field, so we need to parse it
        if (typeof reportData.dpsRankings === 'string') {
          dpsRankings = JSON.parse(reportData.dpsRankings);
        } else {
          dpsRankings = reportData.dpsRankings;
        }
        
        if (typeof reportData.hpsRankings === 'string') {
          hpsRankings = JSON.parse(reportData.hpsRankings);
        } else {
          hpsRankings = reportData.hpsRankings;
        }
      } catch (err) {
        console.error("Error parsing rankings data:", err);
        // Continue without rankings data
        dpsRankings = null;
        hpsRankings = null;
      }
      
      // Create a map to identify which players are healers based on their specs
      const healerMap = new Map<string, boolean>();
      
      // List of healing specs
      const healingSpecs = ['Restoration', 'Holy', 'Discipline', 'Mistweaver', 'Preservation'];
      // If we have rankings data, update player specs and extract parse percentiles
      if (dpsRankings && dpsRankings.data) {
        dpsRankings.data.forEach((ranking: any) => {
          // Process each role in the rankings
          ['tanks', 'healers', 'dps'].forEach(role => {
            if (ranking.roles && ranking.roles[role] && ranking.roles[role].characters) {
              ranking.roles[role].characters.forEach((character: any) => {
                // Update player spec information if available
                const playerKey = `${character.name}-${character.server.name}`;
                if (extractedPlayers.has(playerKey)) {
                  const player = extractedPlayers.get(playerKey);
                  if (player && (!player.spec || player.spec === "null")) {
                    player.spec = character.spec;
                    extractedPlayers.set(playerKey, player);
                  }
                }
              });
            }
          });
        });
      }
      
      // Also add any healer specs from HPS rankings that we didn't get from DPS
      if (hpsRankings && hpsRankings.data) {
        hpsRankings.data.forEach((ranking: any) => {
          if (ranking.roles && ranking.roles.healers && ranking.roles.healers.characters) {
            ranking.roles.healers.characters.forEach((character: any) => {
              const playerKey = `${character.name}-${character.server.name}`;
              if (extractedPlayers.has(playerKey)) {
                const player = extractedPlayers.get(playerKey);
                if (player && (!player.spec || player.spec === "null")) {
                  player.spec = character.spec;
                  extractedPlayers.set(playerKey, player);
                }
              }
            });
          }
        });
      }
      
      const playersList = Array.from(extractedPlayers.values());
      
      // Identify healers by their spec
      playersList.forEach(player => {
        if (healingSpecs.includes(player.spec || '')) {
          healerMap.set(`${player.name}-${player.server}`, true);
        }
      });
      
      // If we have HPS rankings, mark the healers
      if (hpsRankings && hpsRankings.data) {
        hpsRankings.data.forEach((ranking: any) => {
          if (ranking.roles && ranking.roles.healers) {
            const healers = ranking.roles.healers.characters || [];
            healers.forEach((healer: any) => {
              healerMap.set(`${healer.name}-${healer.server.name}`, true);
            });
          }
        });
      }
      
      // Process fights and parses
      const bossFights = raidFights.reduce((acc: any, fight: any) => {
        const bossName = fight.name;
        if (!acc[bossName]) {
          acc[bossName] = {
            bossID: fight.id,
            zoneName: fight.gameZone?.name,
            fights: []
          };
        }
        
        // Format the fight data to include pulls information
        acc[bossName].fights.push({
          id: fight.id,
          startTime: fight.startTime,
          endTime: fight.endTime,
          isKill: fight.kill === true,
          bossPercentage: fight.bossPercentage || 0,
          fightPercentage: fight.fightPercentage || 0,
          difficulty: fight.difficulty || 0
        });
        
        return acc;
      }, {});
      
      // Process parses from the rankings data
      const fightPlayerParses: Record<string, FightParse> = {};
      
      // Build a map of fight ID to parses
      const fightIdToParses = new Map<number, Parse[]>();
      
      // Process both DPS and HPS rankings to build parses
      const processFightParses = (
        rankings: any, 
        isFightIdPresent: (fightId: number) => boolean,
        getParsesByFightId: (fightId: number) => Parse[]
      ) => {
        if (!rankings || !rankings.data) return;
        
        rankings.data.forEach((ranking: any) => {
          const fightId = ranking.fightID;
          
          // Skip if this fight is already processed
          if (!isFightIdPresent(fightId)) {
            const parsesForFight: Parse[] = [];
            fightIdToParses.set(fightId, parsesForFight);
          }
          
          const existingParses = getParsesByFightId(fightId);
          
          // Process all roles
          for (const role of ["tanks", "healers", "dps"]) {
            if (ranking.roles && ranking.roles[role] && ranking.roles[role].characters) {
              ranking.roles[role].characters.forEach((character: any) => {
                const playerKey = `${character.name}-${character.server.name}`;
                const isHealer = healerMap.has(playerKey);
                
                // For healers, we only want to process them in HPS rankings
                // For non-healers, we only want to process them in DPS rankings
                if ((rankings === hpsRankings && isHealer) || (rankings === dpsRankings && !isHealer)) {
                  const existingParseIndex = existingParses.findIndex(
                    p => p.playerName === character.name
                  );
                  
                  // Create or update the parse
                  const spec = character.spec || extractedPlayers.get(`${character.name}-${character.server.name}`)?.spec || 'Unknown';
                  const characterClass = character.class || extractedPlayers.get(`${character.name}-${character.server.name}`)?.class || 'Unknown';
                  
                  // Determine if this is a healing parse based on the spec or role
                  const isHealingSpec = ['Restoration', 'Holy', 'Discipline', 'Mistweaver', 'Preservation'].includes(spec);
                  const isHealer = healerMap.has(`${character.name}-${character.server.name}`) || isHealingSpec;
                  
                  const parse = {
                    playerName: character.name,
                    percentile: Math.floor(character.rankPercent || 0),
                    spec: spec,
                    class: characterClass,
                    isHealingParse: rankings === hpsRankings || isHealer
                  };
                  
                  if (existingParseIndex >= 0) {
                    existingParses[existingParseIndex] = parse;
                  } else {
                    existingParses.push(parse);
                  }
                }
              });
            }
          }
        });
      };
      
      // Process both DPS and HPS rankings
      processFightParses(
        dpsRankings, 
        (fightId) => fightIdToParses.has(fightId),
        (fightId) => fightIdToParses.get(fightId) || []
      );
      
      processFightParses(
        hpsRankings, 
        (fightId) => fightIdToParses.has(fightId),
        (fightId) => fightIdToParses.get(fightId) || []
      );
      
      // Create FightParse objects for each boss
      for (const [bossName, bossData] of Object.entries(bossFights)) {
        const bossID = (bossData as any).bossID;
        const zoneName = (bossData as any).zoneName;
        const fights = (bossData as any).fights;
        
        // Group parses by attempt/pull
        const pullsData: Pull[] = fights.map((fight: any, index: number) => {
          // Get parses for this fight if available
          const pullParses = fightIdToParses.get(fight.id) || [];
          
          // Sort parses by percentile (highest first)
          const sortedParses = [...pullParses].sort((a, b) => b.percentile - a.percentile);
          
          // In v2 API, bossPercentage represents remaining health as a percentage (0-100)
          // Unlike v1 where it was a value between 0-10000
          const bossPercentage = fight.bossPercentage || 0;
          
          return {
            id: fight.id,
            attempt: index + 1,
            startTime: fight.startTime,
            endTime: fight.endTime,
            isKill: fight.isKill, 
            duration: formatTime(fight.endTime - fight.startTime),
            date: formatDate(reportData.startTime + fight.startTime),
            parses: sortedParses,
            fightDetails: {
              bossPercentage: bossPercentage
            }
          };
        });
        
        // Create best parses for boss overview (best parse per player across all pulls)
        const playerBestParses: Record<string, Parse> = {};
        
        // Collect best parse per player across all pulls
        pullsData.forEach(pull => {
          // Only consider kill pulls for parses
          if (pull.isKill) {
            pull.parses.forEach(parse => {
              if (!playerBestParses[parse.playerName] || 
                  playerBestParses[parse.playerName].percentile < parse.percentile) {
                playerBestParses[parse.playerName] = parse;
              }
            });
          }
        });
        
        // If no kill pulls have parses, try to use any pull that has parse data
        if (Object.keys(playerBestParses).length === 0) {
          pullsData.forEach(pull => {
            pull.parses.forEach(parse => {
              if (!playerBestParses[parse.playerName] || 
                  playerBestParses[parse.playerName].percentile < parse.percentile) {
                playerBestParses[parse.playerName] = parse;
              }
            });
          });
        }
        
        // Convert to array and sort
        const bestParses = Object.values(playerBestParses);
        bestParses.sort((a, b) => b.percentile - a.percentile);
        
        // Determine the final boss percentage (for wipes)
        let finalBossPercentage = 0;
        if (pullsData.length > 0) {
          const lastWipePull = [...pullsData]
            .filter(pull => !pull.isKill)
            .sort((a, b) => b.endTime - a.endTime)[0];
            
          finalBossPercentage = lastWipePull ? lastWipePull.fightDetails.bossPercentage : 0;
        }
        
        // Store in fight parses
        fightPlayerParses[bossName] = {
          parses: bestParses,
          fightId: (bossData as any).fights[0].id, // Use first fight ID
          fightDetails: {
            bossID,
            zoneName,
            kill: pullsData.some(pull => pull.isKill),
            bossPercentage: finalBossPercentage
          },
          pulls: pullsData
        };
      }

      // Get the first fight as default selected
      const fightNames = Object.keys(fightPlayerParses);
      const firstFight = fightNames.length > 0 ? fightNames[0] : '';
      
      // Fetch attendance data separately
      const attendanceData = await fetchAttendanceData(reportCode);
      
      // Return the processed report data
      return {
        reportCode,
        reportTitle,
        startTime: reportData.startTime,
        players: playersList,
        fightParses: fightPlayerParses,
        selectedFight: firstFight,
        loading: false,
        error: null,
        attendanceData // Include the attendance data
      };
      
    } catch (err: any) {
      console.error('Error fetching report:', reportCode, err);
      return {
        reportCode,
        reportTitle: 'Error Loading Report',
        startTime: 0,
        players: [],
        fightParses: {},
        selectedFight: '',
        loading: false,
        error: err.message
      };
    }
  };

  // Fetch all reports data
  const fetchReports = useCallback(async () => {
    if (reportCodes.length === 0 || !apiKey) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const newReportsData: Record<string, ReportData> = {};
      
      // Fetch each report in sequence
      for (const reportCode of reportCodes) {
        if (!reportCode) continue;
        
        const reportData = await fetchSingleReport(reportCode);
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

  // Update report codes
  const updateReportCodes = (newCodes: string[]) => {
    setReportCodes(newCodes.filter(Boolean));
  };

  // Calculate comparison between two reports
  const calculateReportComparison = (baselineReportId: string, compareReportId: string) => {
    const baselineData = reportsData[baselineReportId];
    const compareData = reportsData[compareReportId];
    
    if (!baselineData || !compareData) {
      return null;
    }

    const baselineAverages = calculatePlayerAverages(baselineReportId);
    const compareAverages = calculatePlayerAverages(compareReportId);
    
    // Create lookup maps for easy access
    const baselineMap = new Map(baselineAverages.map(p => [p.playerName, p]));
    const compareMap = new Map(compareAverages.map(p => [p.playerName, p]));
    
    // Get all unique player names from both reports
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
        if (totalChange <= 2) { // Consider changes <= 2% as stable
          status = 'stable';
        } else if (changes.totalAverageChange > 0) {
          status = 'improved';
        } else {
          status = 'decreased';
        }
      } else {
        status = 'stable'; // Shouldn't happen, but just in case
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

  // Calculate timeline analysis across all reports
  const calculateTimelineAnalysis = () => {
    const reportIds = Object.keys(reportsData);
    if (reportIds.length < 2) return null;

    // Sort reports by startTime (chronological order)
    const sortedReports = reportIds
      .map(id => ({ id, data: reportsData[id] }))
      .filter(report => report.data.startTime > 0) // Filter out error reports
      .sort((a, b) => a.data.startTime - b.data.startTime);

    if (sortedReports.length < 2) return null;

    // Create report snapshots
    const reportSnapshots = sortedReports.map(({ id, data }) => {
      const playerAverages = calculatePlayerAverages(id);
      
      // Calculate raid averages
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

      // Create player averages lookup
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
        formattedDate: formatDate(data.startTime),
        raidAverages,
        playerAverages: playerAveragesLookup
      };
    });

    // Get all unique players across all reports
    const allPlayers = new Set<string>();
    reportSnapshots.forEach(snapshot => {
      Object.keys(snapshot.playerAverages).forEach(playerName => {
        allPlayers.add(playerName);
      });
    });

    // Calculate player progressions
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

      // Determine trend
      let overallTrend: 'improving' | 'declining' | 'stable' | 'inconsistent';
      if (Math.abs(totalChange) <= 3) {
        overallTrend = 'stable';
      } else if (totalChange > 0) {
        // Check if it's consistently improving
        let improvementCount = 0;
        for (let i = 1; i < dataPoints.length; i++) {
          if (dataPoints[i].totalAverage >= dataPoints[i - 1].totalAverage) {
            improvementCount++;
          }
        }
        overallTrend = improvementCount >= dataPoints.length * 0.7 ? 'improving' : 'inconsistent';
      } else {
        // Check if it's consistently declining
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

    // Calculate raid trend
    const firstRaidAverage = reportSnapshots[0].raidAverages.totalAverage;
    const lastRaidAverage = reportSnapshots[reportSnapshots.length - 1].raidAverages.totalAverage;
    const raidOverallChange = lastRaidAverage - firstRaidAverage;
    
    let raidTrend: 'improving' | 'declining' | 'stable';
    if (Math.abs(raidOverallChange) <= 2) {
      raidTrend = 'stable';
    } else {
      raidTrend = raidOverallChange > 0 ? 'improving' : 'declining';
    }

    // Calculate summary statistics
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

  // Effect to fetch reports when dependencies change
  useEffect(() => {
    fetchReports();
  }, [fetchReports, forceRefresh]);

  return {
    loading,
    error,
    reportsData,
    wipefestScores,
    importWipefestScores,
    calculatePlayerAverages,
    calculateMergedPlayerAverages,
    calculateReportComparison,
    calculateTimelineAnalysis,
    setSelectedFight,
    updateReportCodes,
    fetchReports,
    getClassColor,
    formatTime,
    getPercentileBadgeVariant
  };
};