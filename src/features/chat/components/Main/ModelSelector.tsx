import React from 'react';
import { Button } from '@shared/ui/button';
import { Label } from '@shared/ui/label';
import { Slider } from '@shared/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import { Badge } from '@shared/ui/badge';
import { Brain, Zap, Settings, Info } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  temperature: number;
  onTemperatureChange: (temperature: number) => void;
}

const models = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Most capable model',
    icon: Brain,
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'High quality responses',
    icon: Brain,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and efficient',
    icon: Zap,
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    description: "Anthropic's most capable",
    icon: Brain,
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    description: 'Balanced performance',
    icon: Brain,
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    description: 'Fast and lightweight',
    icon: Zap,
  },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  temperature,
  onTemperatureChange,
}) => {
  const selectedModelInfo = models.find((m) => m.id === selectedModel);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Settings className="h-4 w-4" />
        <h3 className="text-sm font-medium">Model Settings</h3>
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <Label htmlFor="model-select">Model</Label>
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => {
              const Icon = model.icon;
              return (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {model.description}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {selectedModelInfo && (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {selectedModelInfo.name}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {selectedModelInfo.description}
            </span>
          </div>
        )}
      </div>

      {/* Temperature Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="temperature-slider">Temperature</Label>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-muted-foreground">{temperature}</span>
            <Info className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        <Slider
          value={[temperature]}
          onValueChange={([value]) => onTemperatureChange(value)}
          min={0}
          max={2}
          step={0.1}
          className="w-full"
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Focused</span>
          <span>Balanced</span>
          <span>Creative</span>
        </div>
      </div>

      {/* Model Info */}
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>• Higher temperature = more creative responses</p>
        <p>• Lower temperature = more focused responses</p>
        <p>• Recommended: 0.7 for most tasks</p>
      </div>
    </div>
  );
};
