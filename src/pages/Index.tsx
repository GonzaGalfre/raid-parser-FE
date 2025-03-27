
import React from 'react';
import PlayerCard from '@/components/PlayerCard';
import BossfightTabs from '@/components/BossfightTabs';
import AveragePerformanceTable from '@/components/AveragePerformanceTable';

// Sample player data
const PLAYERS = [
  { name: "Morhion", realm: "Silvermoon", itemLevel: "482", playerClass: "mage" as const },
  { name: "Sneakyboi", realm: "Ravencrest", itemLevel: "484", playerClass: "rogue" as const },
  { name: "DarkSlayer", realm: "Draenor", itemLevel: "481", playerClass: "death-knight" as const },
  { name: "ElementMaster", realm: "Silvermoon", itemLevel: "479", playerClass: "shaman" as const },
  { name: "Healinator", realm: "Tarren Mill", itemLevel: "480", playerClass: "priest" as const },
  { name: "NatureFriend", realm: "Silvermoon", itemLevel: "478", playerClass: "druid" as const },
  { name: "LightBringer", realm: "Kazzak", itemLevel: "483", playerClass: "paladin" as const },
  { name: "DoomCaller", realm: "Draenor", itemLevel: "481", playerClass: "warlock" as const },
  { name: "ArrowStorm", realm: "Ravencrest", itemLevel: "480", playerClass: "hunter" as const },
  { name: "BattleMaster", realm: "Kazzak", itemLevel: "477", playerClass: "warrior" as const }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-8">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Raid Performance</h1>
          <p className="text-muted-foreground">Displaying current raid statistics and player performance</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Player cards column */}
          <div className="lg:col-span-3 space-y-6">
            <div className="glass-morphism p-4 rounded-lg mb-4">
              <h2 className="text-xl font-medium mb-3">Raid Roster</h2>
              <div className="space-y-3">
                {PLAYERS.map((player) => (
                  <PlayerCard 
                    key={`${player.name}-${player.realm}`}
                    name={player.name}
                    realm={player.realm}
                    itemLevel={player.itemLevel}
                    playerClass={player.playerClass}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Main content column */}
          <div className="lg:col-span-9 space-y-8">
            <BossfightTabs />
            <AveragePerformanceTable />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
