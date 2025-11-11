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

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  specialty: string;
  isDefault?: boolean;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  temperature: number;
  onTemperatureChange: (temperature: number) => void;
}

const AVAILABLE_MODELS: ModelInfo[] = [
  // Claude - #1 for coding (Nov 2025 - 77.2% SWE-bench) - DEFAULT
  {
    id: 'claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5 ⭐',
    provider: 'Anthropic',
    description: '#1 coding model (77.2% SWE-bench). Best for complex reasoning & 200K context',
    specialty: 'Coding Champion',
    isDefault: true,
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    description: 'Maximum intelligence for deep analysis and research',
    specialty: 'Deep Analysis',
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Previous generation - still excellent for coding',
    specialty: 'Legacy Coding',
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: 'Fastest Claude model for quick tasks',
    specialty: 'Speed',
  },

  // OpenAI - GPT-5 launched Aug 2025
  {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'OpenAI',
    description: 'Latest flagship (Aug 2025). Best for large-context workflows & OpenAI ecosystem',
    specialty: 'All-Purpose',
  },
  {
    id: 'gpt-5-codex',
    name: 'GPT-5 Codex',
    provider: 'OpenAI',
    description: 'Specialized coding variant of GPT-5',
    specialty: 'OpenAI Coding',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Previous gen - still powerful for general use',
    specialty: 'General',
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    description: 'Budget-friendly for simple tasks',
    specialty: 'Budget',
  },

  // Google Gemini - #1 on LMArena for multimodal
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    description: '#1 on LMArena. Best for multimodal tasks & Google ecosystem integration',
    specialty: 'Multimodal',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    description: 'Ultra-fast at 372 tokens/sec for high-volume tasks',
    specialty: 'Ultra Speed',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    description: 'Previous gen - still great for creative content',
    specialty: 'Creative',
  },

  // Perplexity - Best for research & real-time info
  {
    id: 'perplexity-sonar',
    name: 'Perplexity Sonar',
    provider: 'Perplexity',
    description: 'Real-time web search with source citations (10x faster than Gemini 2.0)',
    specialty: 'Research',
  },
  {
    id: 'perplexity-sonar-pro',
    name: 'Perplexity Sonar Pro',
    provider: 'Perplexity',
    description: 'Advanced research with cutting-edge accuracy',
    specialty: 'Deep Research',
  },

  // xAI Grok - Best for real-time reasoning
  {
    id: 'grok-3',
    name: 'Grok 3',
    provider: 'xAI',
    description: 'Cutting-edge reasoning with real-time data access',
    specialty: 'Real-time',
  },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  temperature,
  onTemperatureChange,
}) => {
  // Group models by provider
  const anthropicModels = AVAILABLE_MODELS.filter((m) => m.provider === 'Anthropic');
  const openaiModels = AVAILABLE_MODELS.filter((m) => m.provider === 'OpenAI');
  const geminiModels = AVAILABLE_MODELS.filter((m) => m.provider === 'Google');
  const perplexityModels = AVAILABLE_MODELS.filter((m) => m.provider === 'Perplexity');
  const grokModels = AVAILABLE_MODELS.filter((m) => m.provider === 'xAI');

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
          <SelectTrigger id="model-select" className="h-auto min-h-[44px]">
            <SelectValue placeholder="Select a model">
              {AVAILABLE_MODELS.find((m) => m.id === selectedModel) && (
                <div className="flex flex-col items-start py-1">
                  <span className="font-medium">
                    {AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.specialty}
                  </span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[400px]">
            {/* Anthropic Models */}
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Anthropic (Coding & Writing)
            </div>
            {anthropicModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex flex-col gap-1 py-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {model.specialty}
                    </span>
                  </div>
                  <span className="text-xs leading-tight text-muted-foreground">
                    {model.description}
                  </span>
                </div>
              </SelectItem>
            ))}

            {/* OpenAI Models */}
            <div className="mt-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              OpenAI (General Purpose)
            </div>
            {openaiModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex flex-col gap-1 py-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {model.specialty}
                    </span>
                  </div>
                  <span className="text-xs leading-tight text-muted-foreground">
                    {model.description}
                  </span>
                </div>
              </SelectItem>
            ))}

            {/* Google Gemini Models */}
            <div className="mt-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Google Gemini (Speed & Integration)
            </div>
            {geminiModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex flex-col gap-1 py-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {model.specialty}
                    </span>
                  </div>
                  <span className="text-xs leading-tight text-muted-foreground">
                    {model.description}
                  </span>
                </div>
              </SelectItem>
            ))}

            {/* Perplexity Models */}
            <div className="mt-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Perplexity (Research & Real-time)
            </div>
            {perplexityModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex flex-col gap-1 py-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {model.specialty}
                    </span>
                  </div>
                  <span className="text-xs leading-tight text-muted-foreground">
                    {model.description}
                  </span>
                </div>
              </SelectItem>
            ))}

            {/* xAI Grok Models */}
            {grokModels.length > 0 && (
              <>
                <div className="mt-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  xAI Grok (Real-time Reasoning)
                </div>
                {grokModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex flex-col gap-1 py-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{model.name}</span>
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          {model.specialty}
                        </span>
                      </div>
                      <span className="text-xs leading-tight text-muted-foreground">
                        {model.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
        <p className="mt-2 text-xs text-muted-foreground">
          ⭐ = Recommended default. Claude Sonnet 4.5 is #1 for coding (77.2% SWE-bench Nov 2025).
        </p>
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

// Helper functions for external use
export const getDefaultModel = (): string => {
  return AVAILABLE_MODELS.find((m) => m.isDefault)?.id || 'claude-sonnet-4.5';
};

export const getModelById = (id: string): ModelInfo | undefined => {
  return AVAILABLE_MODELS.find((m) => m.id === id);
};

export const getAllModels = (): ModelInfo[] => {
  return AVAILABLE_MODELS;
};

export const getModelsByProvider = (provider: string): ModelInfo[] => {
  return AVAILABLE_MODELS.filter((m) => m.provider === provider);
};
