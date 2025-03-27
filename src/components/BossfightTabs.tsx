// src/components/BossfightTabs.tsx
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { type FightParse } from '@/services/warcraftLogsApi';

type ClassType =
  | 'death-knight'
  | 'demon-hunter'
  | 'druid'
  | 'hunter'
  | 'mage'
  | 'monk'
  | 'paladin'
  | 'priest'
  | 'rogue'
  | 'shaman'
  | 'warlock'
  | 'warrior'
  | 'evoker';

interface BossfightTabsProps {
  fightParses: Record<string, FightParse>;
  selectedFight: string;
  setSelectedFight: (fightName: string) => void;
  loading: boolean;
}

const normalizeClassName = (wowClass: string): ClassType => {
  // Map API class names to CSS class names
  const classMap: Record<string, ClassType> = {
    'DeathKnight': 'death-knight',
    'Death Knight': 'death-knight',
    'DemonHunter': 'demon-hunter',
    'Demon Hunter': 'demon-hunter',
    'Druid': 'druid', 
    'Hunter': 'hunter',
    'Mage': 'mage',
    'Monk': 'monk',
    'Paladin': 'paladin',
    'Priest': 'priest',
    'Rogue': 'rogue',
    'Shaman': 'shaman',
    'Warlock': 'warlock',
    'Warrior': 'warrior',
    'Evoker': 'evoker'
  };
  
  return classMap[wowClass] || 'warrior';
};

const BossfightTabs: React.FC<BossfightTabsProps> = ({
  fightParses,
  selectedFight,
  setSelectedFight,
  loading
}) => {
  const fightNames = Object.keys(fightParses);

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

  if (fightNames.length === 0) {
    return (
      <div className="w-full animate-fade-in">
        <div className="glass-morphism p-4 rounded-lg">
          <div className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">No fight data available. Please check your configuration.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in">
      <div className="glass-morphism rounded-t-lg">
        <div className="flex border-b border-white/10 overflow-x-auto">
          {fightNames.map((bossName) => (
            <button
              key={bossName}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-colors focus:outline-none whitespace-nowrap",
                selectedFight === bossName
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
              onClick={() => setSelectedFight(bossName)}
            >
              {bossName}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-8 animate-fade-in">
        {selectedFight && (
          <div className="glass-morphism p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                {selectedFight}
              </h3>
              <span
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-full",
                  fightParses[selectedFight]?.fightDetails?.kill
                    ? "bg-kill/20 text-kill"
                    : "bg-wipe/20 text-wipe"
                )}
              >
                {fightParses[selectedFight]?.fightDetails?.kill ? "Kill" : "Wipe"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rank</th>
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Player</th>
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Spec</th>
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Parse</th>
                  </tr>
                </thead>
                <tbody>
                  {fightParses[selectedFight]?.parses.map((parse, index) => (
                    <tr key={`${parse.playerName}-${index}`} className="border-b border-white/5 last:border-0">
                      <td className="py-3 text-sm">{index + 1}</td>
                      <td className={`py-3 text-sm text-wow-${normalizeClassName(parse.class)}`}>
                        {parse.playerName}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">{parse.spec}</td>
                      <td className="py-3 text-sm font-medium text-right">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-md",
                            parse.percentile >= 95 ? "bg-green-500/20 text-green-400" :
                            parse.percentile >= 75 ? "bg-blue-500/20 text-blue-400" :
                            parse.percentile >= 50 ? "bg-purple-500/20 text-purple-400" :
                            parse.percentile >= 25 ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-gray-500/20 text-gray-400"
                          )}
                        >
                          {parse.percentile}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BossfightTabs;