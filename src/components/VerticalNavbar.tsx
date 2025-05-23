import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, Plus, Database, GitCompare } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NavPage = 'hub' | 'add-report' | 'saved-reports' | 'compare';

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

      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="text-xs text-muted-foreground text-center">
          Built with WarcraftLogs API v2
        </div>
      </div>
    </div>
  );
};

export default VerticalNavbar; 