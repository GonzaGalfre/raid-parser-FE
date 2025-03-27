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

  // Fetch report data
  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch report data
      const reportUrl = `https://www.warcraftlogs.com/v1/report/fights/${reportCode}?api_key=${apiKey}`;
      const reportResponse = await fetch(reportUrl);
      
      if (!reportResponse.ok) {
        throw new Error(`HTTP error while fetching report: ${reportResponse.status}`);
      }
      
      const reportJson = await reportResponse.json();
      setReportTitle(reportJson.title || 'Warcraft Logs Report');
      
      // Filter fights to only include those from the target zone
      const raidFights = reportJson.fights.filter((fight: any) => 
        fight.zoneName === targetZone && fight.boss !== 0
      );
      
      // Get players from exported characters with additional class information
      const exportedPlayers = reportJson.exportedCharacters || [];
      
      if (exportedPlayers.length === 0) {
        throw new Error("No players found in exportedCharacters.");
      }
      
      // Enhance player data with class information from friendlies if available
      const enhancedPlayers = exportedPlayers.map((player: any) => {
        const friendly = (reportJson.friendlies || []).find((f: any) => 
          f.name === player.name && f.server === player.server
        );
        
        return {
          ...player,
          class: friendly?.type || null,
          spec: friendly?.icon?.split('-')[1] || null
        };
      });
      
      setPlayers(enhancedPlayers);
      
      // Fetch parses for all players
      const fetchParsesForPlayer = async (player: Player) => {
        const { name, server, region } = player;
        const url = `https://www.warcraftlogs.com/v1/parses/character/${name}/${server}/${region}?api_key=${apiKey}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error(`HTTP error for ${name}: ${res.status}`);
        }
        
        const data = await res.json();
        return data.map((parse: any) => ({ ...parse, playerName: name }));
      };
      
      const allPlayersParsesArrays = await Promise.all(enhancedPlayers.map(fetchParsesForPlayer));
      const allParses = allPlayersParsesArrays.flat();
      
      // Process unique boss encounters and organize by boss name
      const bossFights = raidFights.reduce((acc: any, fight: any) => {
        const bossName = fight.name;
        if (!acc[bossName]) {
          acc[bossName] = {
            bossID: fight.boss,
            zoneName: fight.zoneName,
            fights: []
          };
        }
        
        // Format the fight data to include pulls information
        acc[bossName].fights.push({
          id: fight.id,
          startTime: fight.start_time,
          endTime: fight.end_time,
          isKill: fight.kill === true,
          bossPercentage: fight.bossPercentage || 0,
          fightPercentage: fight.fightPercentage || 0,
          attempts: fight.difficulty || 0
        });
        
        return acc;
      }, {});
      
      // Group parses by fight
      const fightPlayerParses: Record<string, FightParse> = {};
      
      for (const [bossName, bossData] of Object.entries(bossFights)) {
        const bossID = (bossData as any).bossID;
        const zoneName = (bossData as any).zoneName;
        const fights = (bossData as any).fights;
        
        // Get all parses for this boss
        const bossParses = allParses.filter((parse: any) => 
          parse.encounterID === bossID && 
          parse.zoneName === zoneName
        );
        
        // Group parses by attempt/pull
        const pullsData: Pull[] = fights.map((fight: any, index: number) => {
          const pullParses = allParses.filter((parse: any) =>
            parse.reportID === reportCode && parse.fightID === fight.id
          );
          
          const playerParseObjects = pullParses.map((parse: any) => ({
            playerName: parse.playerName,
            percentile: Math.floor(parse.percentile || 0),
            spec: parse.spec,
            class: parse.class
          }));
          
          playerParseObjects.sort((a: Parse, b: Parse) => b.percentile - a.percentile);
          
          return {
            id: fight.id,
            attempt: index + 1,
            startTime: fight.startTime,
            endTime: fight.endTime,
            isKill: fight.isKill,
            duration: formatTime(fight.endTime - fight.startTime),
            date: formatDate(reportJson.start + fight.startTime),
            parses: playerParseObjects.length > 0 ? playerParseObjects : [], // Ensure we always have an array
            fightDetails: {
              bossPercentage: fight.bossPercentage || 0
            }
          };
        });
        
        // Create best parses for boss overview (best parse per player across all pulls)
        const playerBestParses: Record<string, Parse> = {};
        
        // Collect best parse per player across all pulls
        pullsData.forEach(pull => {
          pull.parses.forEach(parse => {
            if (!playerBestParses[parse.playerName] || 
                playerBestParses[parse.playerName].percentile < parse.percentile) {
              playerBestParses[parse.playerName] = parse;
            }
          });
        });
        
        // Convert to array and sort
        const bestParses = Object.values(playerBestParses);
        bestParses.sort((a, b) => b.percentile - a.percentile);
        
        // Store in fight parses
        fightPlayerParses[bossName] = {
          parses: bestParses,
          fightId: (bossData as any).fights[0].id, // Use first fight ID
          fightDetails: {
            bossID,
            zoneName,
            kill: pullsData.some(pull => pull.isKill),
            bossPercentage: pullsData.length > 0 && !pullsData.some(pull => pull.isKill) 
              ? pullsData[pullsData.length - 1].fightDetails.bossPercentage 
              : 0
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportCode && apiKey && targetZone) {
      fetchReport();
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