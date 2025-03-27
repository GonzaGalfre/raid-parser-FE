// src/services/warcraftLogsApi.ts
import { useState, useEffect } from 'react';

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
}

export const useWarcraftLogsApi = (reportCode: string, apiKey: string, targetZone: string, forceRefresh?: number) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState<string>('Warcraft Logs Report');
  const [players, setPlayers] = useState<Player[]>([]);
  const [fightParses, setFightParses] = useState<Record<string, FightParse>>({});
  const [selectedFight, setSelectedFight] = useState<string>('');
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

  // Calculate player averages
  const calculatePlayerAverages = (): PlayerAverage[] => {
    if (Object.keys(fightParses).length === 0) return [];
    
    // Collect all parse entries for each player
    const playerParses: Record<string, {
      playerName: string,
      class: string,
      spec: string | null,
      parses: number[]
    }> = {};
    
    Object.values(fightParses).forEach(fight => {
      fight.parses.forEach(parse => {
        if (!playerParses[parse.playerName]) {
          playerParses[parse.playerName] = {
            playerName: parse.playerName,
            class: parse.class,
            spec: parse.spec, // Will use the most recent spec
            parses: []
          };
        }
        
        playerParses[parse.playerName].parses.push(parse.percentile);
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
        totalAverage
      };
    });
    
    // Sort by total average if available, otherwise by parse percentile (highest first)
    return playerAverages.sort((a, b) => b.totalAverage - a.totalAverage);
  };

  // Fetch report data using v2 GraphQL API
  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    
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
      
      setReportTitle(reportData.title || 'Warcraft Logs Report');
      
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
      
      setPlayers(playersList);
      
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
            isKill: fight.kill, // Corrected from isKill to kill to match the data structure
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
      
      setFightParses(fightPlayerParses);
      
      // Set the first fight as selected by default if there are fights
      const fightNames = Object.keys(fightPlayerParses);
      if (fightNames.length > 0) {
        setSelectedFight(fightNames[0]);
      }
      
    } catch (err: any) {
      console.error('Error in fetchReport:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportCode && apiKey && targetZone) {
      fetchReport();
    } else {
      setLoading(false);
    }
  }, [reportCode, apiKey, targetZone, forceRefresh]);

  return {
    loading,
    error,
    reportTitle,
    players,
    fightParses,
    selectedFight,
    setSelectedFight,
    wipefestScores,
    importWipefestScores,
    calculatePlayerAverages,
    getClassColor,
    formatTime,
    getPercentileBadgeVariant,
    fetchReport
  };
};