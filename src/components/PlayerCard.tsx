
import React from 'react';
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

interface PlayerCardProps {
  name: string;
  realm: string;
  itemLevel: string;
  playerClass: ClassType;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  realm,
  itemLevel,
  playerClass,
}) => {
  return (
    <div 
      className={cn(
        "glass-morphism w-full p-4 mb-3 rounded-md transition-all",
        "border-l-4",
        `border-wow-${playerClass}`,
        "relative overflow-hidden"
      )}
    >
      {/* Color accent */}
      <div 
        className={cn(
          "absolute top-0 left-0 w-full h-full opacity-10",
          `bg-wow-${playerClass}`
        )} 
      />
      
      <div className="flex flex-col relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 
            className={cn(
              "text-lg font-medium tracking-tight",
              `text-wow-${playerClass}`
            )}
          >
            {name}
          </h3>
          <span className="text-sm font-semibold bg-secondary px-2 py-0.5 rounded-md">
            {itemLevel}
          </span>
        </div>
        <div className="text-muted-foreground text-sm">
          {realm}
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
