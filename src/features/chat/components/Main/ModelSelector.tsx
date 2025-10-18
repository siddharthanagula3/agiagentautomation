import React from 'react';
import { Label } from '@shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import { Slider } from '@shared/ui/slider';
import { Separator } from '@shared/ui/separator';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  temperature: number;
  onTemperatureChange: (temperature: number) => void;
}

const AVAILABLE_MODELS = [
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Most capable' },
  { id: 'gpt-4', name: 'GPT-4', description: 'Balanced performance' },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and efficient',
  },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Best reasoning' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fastest' },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  temperature,
  onTemperatureChange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label
          htmlFor="model-select"
          className="mb-2 block text-sm font-medium"
        >
          AI Model
        </Label>
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger id="model-select">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_MODELS.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {model.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label htmlFor="temperature-slider" className="text-sm font-medium">
            Temperature
          </Label>
          <span className="text-sm text-muted-foreground">
            {temperature.toFixed(1)}
          </span>
        </div>
        <Slider
          id="temperature-slider"
          min={0}
          max={2}
          step={0.1}
          value={[temperature]}
          onValueChange={(values) => onTemperatureChange(values[0])}
          className="w-full"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>Precise</span>
          <span>Creative</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Lower temperature makes responses more focused and deterministic. Higher
        temperature makes them more creative and varied.
      </p>
    </div>
  );
};
