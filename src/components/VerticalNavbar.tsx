import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, Plus, Database, GitCompare, Crown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NavPage = 'hub' | 'add-report' | 'saved-reports' | 'compare' | 'bosses' | 'roster';

interface VerticalNavbarProps {
  currentPage: NavPage;
  onPageChange: (page: NavPage) => void;
}

const VerticalNavbar: React.FC<VerticalNavbarProps> = ({ currentPage, onPageChange }) => {
  const navItems = [
    {
      id: 'hub' as const,
      label: 'Hub',
      icon: Home,
      description: 'Main dashboard'
    },
    {
      id: 'add-report' as const,
      label: 'Add Report',
      icon: Plus,
      description: 'Import new analysis'
    },
    {
      id: 'roster' as const,
      label: 'Roster',
      icon: Users,
      description: 'Guild characters'
    },
    {
      id: 'saved-reports' as const,
      label: 'Saved Reports',
      icon: Database,
      description: 'Manage analyses'
    },
    {
      id: 'compare' as const,
      label: 'Compare',
      icon: GitCompare,
      description: 'Compare analyses'
    },
    {
      id: 'bosses' as const,
      label: 'Bosses',
      icon: Crown,
      description: 'Boss statistics'
    }
  ];

  return (
    <div className="w-64 min-h-screen bg-card border-r border-border p-4">
      {/* App Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Raid Parser</h1>
        <p className="text-sm text-muted-foreground">WoW Performance Analysis</p>
      </div>

      {/* Navigation Items */}
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start h-12 px-4',
                isActive && 'bg-primary text-primary-foreground shadow-md'
              )}
              onClick={() => onPageChange(item.id)}
            >
              <Icon className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs opacity-70">{item.description}</div>
              </div>
            </Button>
          );
        })}
      </nav>
    </div>
  );
};

export default VerticalNavbar; 