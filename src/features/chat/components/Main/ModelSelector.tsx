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
  // Kimi K2 Thinking - NEW #1 (Nov 6, 2025) - OPEN-SOURCE & FREE - DEFAULT
  {
    id: 'kimi-k2-thinking',
    name: 'Kimi K2 Thinking ⭐',
    provider: 'Moonshot AI',
    description: '#1 Reasoning Model (Nov 6). Beats GPT-5 & Claude 4.5. 71.3% SWE-bench, 256K context, FREE',
    specialty: 'Reasoning Champion',
    isDefault: true,
  },

  // Claude - Best thinking models from Anthropic
  {
    id: 'claude-sonnet-4.5-thinking',
    name: 'Claude Sonnet 4.5 Thinking',
    provider: 'Anthropic',
    description: 'Advanced reasoning mode with extended thought process. 200K context',
    specialty: 'Deep Reasoning',
  },
  {
    id: 'claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    description: 'Standard mode - fast responses with solid reasoning',
    specialty: 'Balanced',
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

  // OpenAI - GPT-5 with Thinking modes
  {
    id: 'gpt-5-thinking',
    name: 'GPT-5 Thinking',
    provider: 'OpenAI',
    description: 'Extended reasoning mode. 41.7% on Humanity\'s Last Exam. OpenAI ecosystem integration',
    specialty: 'Advanced Thinking',
  },
  {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'OpenAI',
    description: 'Latest flagship (Aug 2025). Fast responses with strong capabilities',
    specialty: 'All-Purpose',
  },
  {
    id: 'gpt-5-codex',
    name: 'GPT-5 Codex',
    provider: 'OpenAI',
    description: 'Specialized coding variant optimized for software engineering',
    specialty: 'Coding',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Previous gen - still powerful for general tasks',
    specialty: 'Legacy',
  },

  // Google Gemini - Advanced thinking & multimodal
  {
    id: 'gemini-2.5-pro-thinking',
    name: 'Gemini 2.5 Pro Thinking',
    provider: 'Google',
    description: 'Advanced reasoning with multimodal support. Google ecosystem integration',
    specialty: 'Multimodal Thinking',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    description: '#1 on LMArena. Fast multimodal processing',
    specialty: 'Multimodal',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    description: 'Ultra-fast at 372 tokens/sec for high-volume tasks',
    specialty: 'Speed',
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
  const moonshotModels = AVAILABLE_MODELS.filter((m) => m.provider === 'Moonshot AI');
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
            {/* Moonshot AI Models - NEW #1 */}
            {moonshotModels.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-primary">
                  ⭐ Moonshot AI (#1 Reasoning - Nov 6, 2025)
                </div>
                {moonshotModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex flex-col gap-1 py-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{model.name}</span>
                        <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                          {model.specialty}
                        </span>
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          FREE & Open-Source
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

            {/* Anthropic Models */}
            <div className="mt-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Anthropic (Deep Reasoning & Coding)
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
          ⭐ = Recommended default. <span className="font-semibold text-green-600 dark:text-green-400">Kimi K2 Thinking</span> is #1 (Nov 6, 2025):
          71.3% SWE-bench, 44.9% Humanity's Last Exam. FREE & open-source.
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
  return AVAILABLE_MODELS.find((m) => m.isDefault)?.id || 'kimi-k2-thinking';
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
