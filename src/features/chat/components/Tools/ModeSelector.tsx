import React from 'react';
import { Label } from '@shared/ui/label';
import { Badge } from '@shared/ui/badge';
import { Users, Code, Search, Zap, User } from 'lucide-react';
import type { ChatMode } from '../../types';

interface ModeSelectorProps {
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  availableModes: ChatMode[];
}

const MODE_CONFIG: Record<
  ChatMode,
  {
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }
> = {
  team: {
    name: 'Team Mode',
    description: 'Multiple AI employees collaborate',
    icon: <Users className="h-4 w-4" />,
    color: 'bg-blue-500/10 text-blue-500',
  },
  engineer: {
    name: 'Engineer Mode',
    description: 'Single AI engineer for coding',
    icon: <Code className="h-4 w-4" />,
    color: 'bg-green-500/10 text-green-500',
  },
  research: {
    name: 'Research Mode',
    description: 'Deep research and analysis',
    icon: <Search className="h-4 w-4" />,
    color: 'bg-purple-500/10 text-purple-500',
  },
  race: {
    name: 'Race Mode',
    description: 'Multiple employees compete',
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-orange-500/10 text-orange-500',
  },
  solo: {
    name: 'Solo Mode',
    description: 'Direct chat with AI',
    icon: <User className="h-4 w-4" />,
    color: 'bg-gray-500/10 text-gray-500',
  },
};

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  availableModes,
}) => {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Chat Mode</Label>

      <div className="space-y-2">
        {availableModes.map((mode) => {
          const config = MODE_CONFIG[mode];
          const isSelected = selectedMode === mode;

          return (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={`w-full rounded-lg border p-3 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-accent/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-md ${config.color}`}
                >
                  {config.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">{config.name}</h4>
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {config.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Current:</strong>{' '}
          {MODE_CONFIG[selectedMode].name}
        </p>
      </div>
    </div>
  );
};
