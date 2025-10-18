import React from 'react';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Users, Code, Search, Zap, Info } from 'lucide-react';
import type { ChatMode } from '../../types';

interface ModeSelectorProps {
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  availableModes: ChatMode[];
}

const modeConfig = {
  team: {
    name: 'Team',
    description: 'Collaborative AI workforce',
    icon: Users,
    color: 'bg-blue-500',
    features: [
      'Multi-agent coordination',
      'Task delegation',
      'Workflow automation',
    ],
  },
  engineer: {
    name: 'Engineer',
    description: 'Code-focused assistance',
    icon: Code,
    color: 'bg-green-500',
    features: ['Code generation', 'Debugging', 'Architecture planning'],
  },
  research: {
    name: 'Research',
    description: 'Deep analysis and investigation',
    icon: Search,
    color: 'bg-purple-500',
    features: ['Web search', 'Data analysis', 'Report generation'],
  },
  race: {
    name: 'Race',
    description: 'Fast parallel processing',
    icon: Zap,
    color: 'bg-orange-500',
    features: ['Parallel execution', 'Speed optimization', 'Concurrent tasks'],
  },
};

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  availableModes,
}) => {
  const currentMode = modeConfig[selectedMode];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Zap className="h-4 w-4" />
        <h3 className="text-sm font-medium">Chat Mode</h3>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-2 gap-2">
        {availableModes.map((mode) => {
          const config = modeConfig[mode];
          const Icon = config.icon;
          const isSelected = selectedMode === mode;

          return (
            <Button
              key={mode}
              variant={isSelected ? 'default' : 'outline'}
              onClick={() => onModeChange(mode)}
              className={`flex h-auto flex-col items-start space-y-2 p-3 ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="flex w-full items-center space-x-2">
                <Icon className="h-4 w-4" />
                <span className="font-medium">{config.name}</span>
                {isSelected && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-left text-xs text-muted-foreground">
                {config.description}
              </p>
            </Button>
          );
        })}
      </div>

      {/* Current Mode Info */}
      {currentMode && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${currentMode.color}`} />
            <span className="text-sm font-medium">{currentMode.name} Mode</span>
          </div>

          <p className="text-xs text-muted-foreground">
            {currentMode.description}
          </p>

          <div className="space-y-1">
            <p className="text-xs font-medium">Features:</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {currentMode.features.map((feature, index) => (
                <li key={index} className="flex items-center space-x-1">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Mode Info */}
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <Info className="h-3 w-3" />
          <span>Switch modes to change AI behavior</span>
        </div>
        <p>Each mode optimizes for different types of tasks and workflows.</p>
      </div>
    </div>
  );
};
