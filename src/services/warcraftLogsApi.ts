
// src/services/warcraftLogsApi.ts

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
  attendanceData?: AttendanceData;
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
  attendance?: {
    present: number;
    total: number;
  };
}

const formatTime = (timeInMs: number): string => {
  if (!timeInMs || isNaN(timeInMs)) return '00:00';
  const seconds = Math.floor(timeInMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export const fetchAttendanceData = async (reportCode: string, apiKey: string): Promise<AttendanceData | null> => {
  if (!reportCode || !apiKey) return null;

  try {
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

    const response = await fetch('https://www.warcraftlogs.com/api/v2/client', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query: attendanceQuery }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error while fetching attendance: ${response.status}`);
    }

    const responseJson = await response.json();

    if (responseJson.errors) {
      throw new Error(`GraphQL error: ${responseJson.errors[0].message}`);
    }

    const reportData = responseJson.data.reportData.report;

    if (!reportData) {
      throw new Error('No report data found');
    }

    const playerAttendance: Record<string, number> = {};
    const actorsMap: Record<number, { name: string; server: string }> = {};

    if (reportData.masterData && reportData.masterData.actors) {
      reportData.masterData.actors.forEach((actor: any) => {
        if (actor.type === 'Player') {
          actorsMap[actor.id] = {
            name: actor.name,
            server: actor.server,
          };
        }
      });
    }

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
      totalPulls,
    };
  } catch (err: any) {
    console.error('Error fetching attendance data:', err);
    return null;
  }
};

export const fetchSingleReport = async (reportCode: string, apiKey: string, targetZone: string): Promise<ReportData | null> => {
  if (!reportCode || !apiKey) return null;

  try {
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

    const graphqlResponse = await fetch('https://www.warcraftlogs.com/api/v2/client', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query: reportQuery }),
    });

    if (!graphqlResponse.ok) {
      throw new Error(`HTTP error while fetching report: ${graphqlResponse.status}`);
    }

    const responseJson = await graphqlResponse.json();

    if (responseJson.errors) {
      throw new Error(`GraphQL error: ${responseJson.errors[0].message}`);
    }

    const reportData = responseJson.data.reportData.report;

    if (!reportData) {
      throw new Error('No report data found');
    }

    const reportTitle = reportData.title || 'Warcraft Logs Report';
    const raidFights = reportData.fights.filter(
      (fight: any) => fight.gameZone?.name === targetZone && fight.name !== ''
    );

    const extractedPlayers = new Map<string, Player>();

    if (reportData.masterData && reportData.masterData.actors) {
      reportData.masterData.actors.forEach((actor: any) => {
        if (actor.type === 'Player') {
          const playerKey = `${actor.name}-${actor.server}`;
          if (!extractedPlayers.has(playerKey)) {
            extractedPlayers.set(playerKey, {
              name: actor.name,
              server: actor.server,
              region: 'US',
              class: actor.subType,
              spec: null,
            });
          }
        }
      });
    }

    let dpsRankings;
    let hpsRankings;

    try {
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
      console.error('Error parsing rankings data:', err);
      dpsRankings = null;
      hpsRankings = null;
    }

    const healerMap = new Map<string, boolean>();
    const healingSpecs = ['Restoration', 'Holy', 'Discipline', 'Mistweaver', 'Preservation'];

    if (dpsRankings && dpsRankings.data) {
      dpsRankings.data.forEach((ranking: any) => {
        ['tanks', 'healers', 'dps'].forEach(role => {
          if (ranking.roles && ranking.roles[role] && ranking.roles[role].characters) {
            ranking.roles[role].characters.forEach((character: any) => {
              const playerKey = `${character.name}-${character.server.name}`;
              if (extractedPlayers.has(playerKey)) {
                const player = extractedPlayers.get(playerKey);
                if (player && (!player.spec || player.spec === 'null')) {
                  player.spec = character.spec;
                  extractedPlayers.set(playerKey, player);
                }
              }
            });
          }
        });
      });
    }

    if (hpsRankings && hpsRankings.data) {
      hpsRankings.data.forEach((ranking: any) => {
        if (ranking.roles && ranking.roles.healers && ranking.roles.healers.characters) {
          ranking.roles.healers.characters.forEach((character: any) => {
            const playerKey = `${character.name}-${character.server.name}`;
            if (extractedPlayers.has(playerKey)) {
              const player = extractedPlayers.get(playerKey);
              if (player && (!player.spec || player.spec === 'null')) {
                player.spec = character.spec;
                extractedPlayers.set(playerKey, player);
              }
            }
          });
        }
      });
    }

    const playersList = Array.from(extractedPlayers.values());

    playersList.forEach(player => {
      if (healingSpecs.includes(player.spec || '')) {
        healerMap.set(`${player.name}-${player.server}`, true);
      }
    });

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

    const bossFights = raidFights.reduce((acc: any, fight: any) => {
      const bossName = fight.name;
      if (!acc[bossName]) {
        acc[bossName] = {
          bossID: fight.id,
          zoneName: fight.gameZone?.name,
          fights: [],
        };
      }
      acc[bossName].fights.push({
        id: fight.id,
        startTime: fight.startTime,
        endTime: fight.endTime,
        isKill: fight.kill === true,
        bossPercentage: fight.bossPercentage || 0,
        fightPercentage: fight.fightPercentage || 0,
        difficulty: fight.difficulty || 0,
      });
      return acc;
    }, {});

    const fightPlayerParses: Record<string, FightParse> = {};
    const fightIdToParses = new Map<number, Parse[]>();

    const processFightParses = (
      rankings: any,
      isFightIdPresent: (fightId: number) => boolean,
      getParsesByFightId: (fightId: number) => Parse[]
    ) => {
      if (!rankings || !rankings.data) return;

      rankings.data.forEach((ranking: any) => {
        const fightId = ranking.fightID;

        if (!isFightIdPresent(fightId)) {
          const parsesForFight: Parse[] = [];
          fightIdToParses.set(fightId, parsesForFight);
        }

        const existingParses = getParsesByFightId(fightId);

        for (const role of ['tanks', 'healers', 'dps']) {
          if (ranking.roles && ranking.roles[role] && ranking.roles[role].characters) {
            ranking.roles[role].characters.forEach((character: any) => {
              const playerKey = `${character.name}-${character.server.name}`;
              const isHealer = healerMap.has(playerKey);

              if ((rankings === hpsRankings && isHealer) || (rankings === dpsRankings && !isHealer)) {
                const existingParseIndex = existingParses.findIndex(
                  p => p.playerName === character.name
                );

                const spec = character.spec || extractedPlayers.get(`${character.name}-${character.server.name}`)?.spec || 'Unknown';
                const characterClass = character.class || extractedPlayers.get(`${character.name}-${character.server.name}`)?.class || 'Unknown';
                const isHealingSpec = ['Restoration', 'Holy', 'Discipline', 'Mistweaver', 'Preservation'].includes(spec);
                const isHealerParse = rankings === hpsRankings || isHealer || isHealingSpec;

                const parse = {
                  playerName: character.name,
                  percentile: Math.floor(character.rankPercent || 0),
                  spec: spec,
                  class: characterClass,
                  isHealingParse: isHealerParse,
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

    for (const [bossName, bossData] of Object.entries(bossFights)) {
      const bossID = (bossData as any).bossID;
      const zoneName = (bossData as any).zoneName;
      const fights = (bossData as any).fights;

      const pullsData: Pull[] = fights.map((fight: any, index: number) => {
        const pullParses = fightIdToParses.get(fight.id) || [];
        const sortedParses = [...pullParses].sort((a, b) => b.percentile - a.percentile);
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
            bossPercentage: bossPercentage,
          },
        };
      });

      const playerBestParses: Record<string, Parse> = {};

      pullsData.forEach(pull => {
        if (pull.isKill) {
          pull.parses.forEach(parse => {
            if (!playerBestParses[parse.playerName] || playerBestParses[parse.playerName].percentile < parse.percentile) {
              playerBestParses[parse.playerName] = parse;
            }
          });
        }
      });

      if (Object.keys(playerBestParses).length === 0) {
        pullsData.forEach(pull => {
          pull.parses.forEach(parse => {
            if (!playerBestParses[parse.playerName] || playerBestParses[parse.playerName].percentile < parse.percentile) {
              playerBestParses[parse.playerName] = parse;
            }
          });
        });
      }

      const bestParses = Object.values(playerBestParses);
      bestParses.sort((a, b) => b.percentile - a.percentile);

      let finalBossPercentage = 0;
      if (pullsData.length > 0) {
        const lastWipePull = [...pullsData]
          .filter(pull => !pull.isKill)
          .sort((a, b) => b.endTime - a.endTime)[0];
        finalBossPercentage = lastWipePull ? lastWipePull.fightDetails.bossPercentage : 0;
      }

      fightPlayerParses[bossName] = {
        parses: bestParses,
        fightId: (bossData as any).fights[0].id,
        fightDetails: {
          bossID,
          zoneName,
          kill: pullsData.some(pull => pull.isKill),
          bossPercentage: finalBossPercentage,
        },
        pulls: pullsData,
      };
    }

    const fightNames = Object.keys(fightPlayerParses);
    const firstFight = fightNames.length > 0 ? fightNames[0] : '';

    const attendanceData = await fetchAttendanceData(reportCode, apiKey);

    return {
      reportCode,
      reportTitle,
      startTime: reportData.startTime,
      players: playersList,
      fightParses: fightPlayerParses,
      selectedFight: firstFight,
      loading: false,
      error: null,
      attendanceData,
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
      error: err.message,
    };
  }
};
