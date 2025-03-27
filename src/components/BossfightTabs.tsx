
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

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

interface PlayerPerformance {
  rank: number;
  player: string;
  playerClass: ClassType;
  spec: string;
  parse: number;
}

interface Pull {
  id: number;
  isKill: boolean;
  performances: PlayerPerformance[];
}

interface BossData {
  name: string;
  pulls: Pull[];
}

const BOSSES_DATA: BossData[] = [
  {
    name: "Boss Alpha",
    pulls: [
      {
        id: 1,
        isKill: true,
        performances: [
          { rank: 1, player: "Morhion", playerClass: "mage", spec: "Frost Mage", parse: 97 },
          { rank: 2, player: "Sneakyboi", playerClass: "rogue", spec: "Subtlety Rogue", parse: 95 },
          { rank: 3, player: "Healinator", playerClass: "priest", spec: "Holy Priest", parse: 92 },
          { rank: 4, player: "DarkSlayer", playerClass: "death-knight", spec: "Unholy Death Knight", parse: 89 },
          { rank: 5, player: "ElementMaster", playerClass: "shaman", spec: "Elemental Shaman", parse: 85 },
        ]
      },
      {
        id: 2,
        isKill: false,
        performances: [
          { rank: 1, player: "Morhion", playerClass: "mage", spec: "Frost Mage", parse: 92 },
          { rank: 2, player: "DarkSlayer", playerClass: "death-knight", spec: "Unholy Death Knight", parse: 91 },
          { rank: 3, player: "Sneakyboi", playerClass: "rogue", spec: "Subtlety Rogue", parse: 89 },
          { rank: 4, player: "ElementMaster", playerClass: "shaman", spec: "Elemental Shaman", parse: 83 },
          { rank: 5, player: "Healinator", playerClass: "priest", spec: "Holy Priest", parse: 81 },
        ]
      }
    ]
  },
  {
    name: "Boss Beta",
    pulls: [
      {
        id: 1,
        isKill: false,
        performances: [
          { rank: 1, player: "Sneakyboi", playerClass: "rogue", spec: "Subtlety Rogue", parse: 94 },
          { rank: 2, player: "DarkSlayer", playerClass: "death-knight", spec: "Unholy Death Knight", parse: 93 },
          { rank: 3, player: "Morhion", playerClass: "mage", spec: "Frost Mage", parse: 90 },
          { rank: 4, player: "ElementMaster", playerClass: "shaman", spec: "Elemental Shaman", parse: 86 },
          { rank: 5, player: "Healinator", playerClass: "priest", spec: "Holy Priest", parse: 83 },
        ]
      },
      {
        id: 2,
        isKill: true,
        performances: [
          { rank: 1, player: "DarkSlayer", playerClass: "death-knight", spec: "Unholy Death Knight", parse: 98 },
          { rank: 2, player: "Sneakyboi", playerClass: "rogue", spec: "Subtlety Rogue", parse: 96 },
          { rank: 3, player: "Morhion", playerClass: "mage", spec: "Frost Mage", parse: 95 },
          { rank: 4, player: "ElementMaster", playerClass: "shaman", spec: "Elemental Shaman", parse: 88 },
          { rank: 5, player: "Healinator", playerClass: "priest", spec: "Holy Priest", parse: 87 },
        ]
      }
    ]
  },
  {
    name: "Boss Gamma",
    pulls: [
      {
        id: 1,
        isKill: false,
        performances: [
          { rank: 1, player: "Morhion", playerClass: "mage", spec: "Frost Mage", parse: 89 },
          { rank: 2, player: "Sneakyboi", playerClass: "rogue", spec: "Subtlety Rogue", parse: 87 },
          { rank: 3, player: "ElementMaster", playerClass: "shaman", spec: "Elemental Shaman", parse: 86 },
          { rank: 4, player: "DarkSlayer", playerClass: "death-knight", spec: "Unholy Death Knight", parse: 83 },
          { rank: 5, player: "Healinator", playerClass: "priest", spec: "Holy Priest", parse: 80 },
        ]
      },
      {
        id: 2,
        isKill: false,
        performances: [
          { rank: 1, player: "Sneakyboi", playerClass: "rogue", spec: "Subtlety Rogue", parse: 92 },
          { rank: 2, player: "Morhion", playerClass: "mage", spec: "Frost Mage", parse: 90 },
          { rank: 3, player: "DarkSlayer", playerClass: "death-knight", spec: "Unholy Death Knight", parse: 88 },
          { rank: 4, player: "ElementMaster", playerClass: "shaman", spec: "Elemental Shaman", parse: 85 },
          { rank: 5, player: "Healinator", playerClass: "priest", spec: "Holy Priest", parse: 82 },
        ]
      },
      {
        id: 3,
        isKill: true,
        performances: [
          { rank: 1, player: "ElementMaster", playerClass: "shaman", spec: "Elemental Shaman", parse: 99 },
          { rank: 2, player: "Sneakyboi", playerClass: "rogue", spec: "Subtlety Rogue", parse: 97 },
          { rank: 3, player: "Morhion", playerClass: "mage", spec: "Frost Mage", parse: 96 },
          { rank: 4, player: "DarkSlayer", playerClass: "death-knight", spec: "Unholy Death Knight", parse: 93 },
          { rank: 5, player: "Healinator", playerClass: "priest", spec: "Holy Priest", parse: 91 },
        ]
      }
    ]
  }
];

const BossfightTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="w-full animate-fade-in">
      <div className="glass-morphism rounded-t-lg">
        <div className="flex border-b border-white/10">
          {BOSSES_DATA.map((boss, index) => (
            <button
              key={index}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-colors focus:outline-none",
                activeTab === index 
                  ? "text-primary border-b-2 border-primary" 
                  : "text-muted-foreground hover:text-primary"
              )}
              onClick={() => setActiveTab(index)}
            >
              {boss.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-6 space-y-8 animate-fade-in">
        {BOSSES_DATA[activeTab].pulls.map((pull) => (
          <div key={pull.id} className="glass-morphism p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                Pull #{pull.id}
              </h3>
              <span 
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-full",
                  pull.isKill 
                    ? "bg-kill/20 text-kill" 
                    : "bg-wipe/20 text-wipe"
                )}
              >
                {pull.isKill ? "Kill" : "Wipe"}
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
                  {pull.performances.map((perf) => (
                    <tr key={`${pull.id}-${perf.rank}`} className="border-b border-white/5 last:border-0">
                      <td className="py-3 text-sm">{perf.rank}</td>
                      <td className={`py-3 text-sm text-wow-${perf.playerClass}`}>{perf.player}</td>
                      <td className="py-3 text-sm text-muted-foreground">{perf.spec}</td>
                      <td className="py-3 text-sm font-medium text-right">
                        <span 
                          className={cn(
                            "px-2 py-1 rounded-md",
                            perf.parse >= 95 ? "bg-green-500/20 text-green-400" :
                            perf.parse >= 75 ? "bg-blue-500/20 text-blue-400" :
                            perf.parse >= 50 ? "bg-purple-500/20 text-purple-400" :
                            perf.parse >= 25 ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-gray-500/20 text-gray-400"
                          )}
                        >
                          {perf.parse}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BossfightTabs;
