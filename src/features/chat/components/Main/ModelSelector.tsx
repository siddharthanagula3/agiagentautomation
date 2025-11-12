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

/**
 * ============================================================================
 * AVAILABLE LLM MODELS - Easy to Update Monthly
 * ============================================================================
 *
 * To add a new model (when providers release updates):
 * 1. Copy an existing model object
 * 2. Update the id, name, description
 * 3. Set isDefault: true on your preferred default model (only one!)
 * 4. Save and the UI automatically updates
 *
 * Model Types:
 * - Thinking Models: For complex reasoning, coding, research (slower, more expensive)
 * - Standard Models: For general chat, quick tasks (faster, cheaper) ⭐ DEFAULT
 *
 * Last Updated: November 2025
 */

const AVAILABLE_MODELS: ModelInfo[] = [
  // ========================================================================
  // RECOMMENDED FOR GENERAL USE (Fast & Cost-Effective)
  // ========================================================================

  // Claude Sonnet 4.5 - Best all-around for general tasks - DEFAULT
  {
    id: 'claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5 ⭐',
    provider: 'Anthropic',
    description:
      'Best for general chat, coding, writing. Fast responses with excellent quality',
    specialty: 'General + Coding',
    isDefault: true, // ⭐ This is the default model for new chats
  },

  // GPT-5 - Best from OpenAI for general use
  {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'OpenAI',
    description:
      'Latest OpenAI flagship (Aug 2025). Excellent for general tasks & ecosystem',
    specialty: 'All-Purpose',
  },

  // Gemini 2.5 Flash - Fastest for quick tasks
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    description:
      'Ultra-fast at 372 tokens/sec. Perfect for quick responses & high volume',
    specialty: 'Ultra Speed',
  },

  // ========================================================================
  // THINKING MODELS (For Complex Reasoning - Slower but Smarter)
  // ========================================================================

  // Kimi K2 Thinking - #1 for complex reasoning (Free & Open-Source!)
  {
    id: 'kimi-k2-thinking',
    name: 'Kimi K2 Thinking',
    provider: 'Moonshot AI',
    description:
      "#1 Reasoning (Nov 6). 71.3% SWE-bench, 44.9% Humanity's Exam. 256K context, FREE",
    specialty: 'Advanced Reasoning',
  },

  // Claude Sonnet 4.5 Thinking - Best from Anthropic
  {
    id: 'claude-sonnet-4.5-thinking',
    name: 'Claude Sonnet 4.5 Thinking',
    provider: 'Anthropic',
    description: 'Extended reasoning mode for complex problems. 200K context',
    specialty: 'Deep Reasoning',
  },

  // GPT-5 Thinking - Best from OpenAI
  {
    id: 'gpt-5-thinking',
    name: 'GPT-5 Thinking',
    provider: 'OpenAI',
    description:
      "Extended reasoning mode. 41.7% Humanity's Exam. Best for OpenAI ecosystem",
    specialty: 'Advanced Thinking',
  },

  // Gemini 2.5 Pro Thinking - Best for multimodal reasoning
  {
    id: 'gemini-2.5-pro-thinking',
    name: 'Gemini 2.5 Pro Thinking',
    provider: 'Google',
    description:
      'Advanced reasoning with images/video support. Google ecosystem',
    specialty: 'Multimodal Reasoning',
  },

  // ========================================================================
  // SPECIALIZED MODELS
  // ========================================================================

  // Coding Specialists
  {
    id: 'gpt-5-codex',
    name: 'GPT-5 Codex',
    provider: 'OpenAI',
    description:
      'Optimized for software engineering, code generation, debugging',
    specialty: 'Coding Specialist',
  },

  // Multimodal
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    description: '#1 on LMArena. Best for images, video, audio processing',
    specialty: 'Multimodal',
  },

  // Research & Real-time Data
  {
    id: 'perplexity-sonar-pro',
    name: 'Perplexity Sonar Pro',
    provider: 'Perplexity',
    description:
      'Real-time web search with citations. Perfect for current events & research',
    specialty: 'Research + Web',
  },

  {
    id: 'perplexity-sonar',
    name: 'Perplexity Sonar',
    provider: 'Perplexity',
    description:
      'Fast web search (10x faster than competitors). Good for quick fact-checking',
    specialty: 'Quick Research',
  },

  // Real-time Reasoning
  {
    id: 'grok-3',
    name: 'Grok 3',
    provider: 'xAI',
    description: 'Real-time data access with cutting-edge reasoning',
    specialty: 'Real-time',
  },

  // ========================================================================
  // LEGACY MODELS (Previous Generations - Still Good)
  // ========================================================================

  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    description: 'Previous gen flagship - still excellent for analysis',
    specialty: 'Legacy Premium',
  },

  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Previous gen - reliable for coding',
    specialty: 'Legacy Coding',
  },

  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: 'Budget-friendly Claude for simple tasks',
    specialty: 'Budget',
  },

  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Previous gen OpenAI - still solid for general use',
    specialty: 'Legacy',
  },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  temperature,
  onTemperatureChange,
}) => {
  // Group models by use case (easier for users to choose)
  const generalModels = AVAILABLE_MODELS.filter((m) =>
    ['claude-sonnet-4.5', 'gpt-5', 'gemini-2.5-flash'].includes(m.id)
  );

  const thinkingModels = AVAILABLE_MODELS.filter(
    (m) =>
      m.specialty.toLowerCase().includes('reasoning') ||
      m.specialty.toLowerCase().includes('thinking') ||
      m.id.includes('thinking')
  );

  const specializedModels = AVAILABLE_MODELS.filter((m) =>
    [
      'gpt-5-codex',
      'gemini-2.5-pro',
      'perplexity-sonar-pro',
      'perplexity-sonar',
      'grok-3',
    ].includes(m.id)
  );

  const legacyModels = AVAILABLE_MODELS.filter(
    (m) =>
      m.specialty.toLowerCase().includes('legacy') ||
      m.specialty.toLowerCase().includes('budget')
  );

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
                    {
                      AVAILABLE_MODELS.find((m) => m.id === selectedModel)
                        ?.specialty
                    }
                  </span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[400px]">
            {/* GENERAL USE - Recommended for most tasks */}
            <div className="px-2 py-1.5 text-xs font-semibold text-primary">
              ⭐ Recommended (Fast & Cost-Effective)
            </div>
            {generalModels.map((model) => (
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

            {/* THINKING MODELS - For complex reasoning */}
            <div className="mt-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              🧠 Thinking Models (Slower, Advanced Reasoning)
            </div>
            {thinkingModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex flex-col gap-1 py-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {model.specialty}
                    </span>
                    {model.id === 'kimi-k2-thinking' && (
                      <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                        FREE
                      </span>
                    )}
                  </div>
                  <span className="text-xs leading-tight text-muted-foreground">
                    {model.description}
                  </span>
                </div>
              </SelectItem>
            ))}

            {/* SPECIALIZED MODELS */}
            <div className="mt-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              🎯 Specialized (Coding, Research, Multimodal)
            </div>
            {specializedModels.map((model) => (
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

            {/* LEGACY MODELS */}
            {legacyModels.length > 0 && (
              <>
                <div className="mt-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  📦 Previous Generations
                </div>
                {legacyModels.map((model) => (
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
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          ⭐{' '}
          <span className="font-semibold text-primary">Claude Sonnet 4.5</span>{' '}
          = Default for general use (fast, high quality).
          <br />
          🧠 Use{' '}
          <span className="font-semibold text-green-600 dark:text-green-400">
            Thinking Models
          </span>{' '}
          for complex reasoning (Kimi K2 is #1, FREE & open-source).
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
// eslint-disable-next-line react-refresh/only-export-components
export const getDefaultModel = (): string => {
  // Returns the model marked as default (Claude Sonnet 4.5 for general use)
  return AVAILABLE_MODELS.find((m) => m.isDefault)?.id || 'claude-sonnet-4.5';
};

// eslint-disable-next-line react-refresh/only-export-components
export const getModelById = (id: string): ModelInfo | undefined => {
  return AVAILABLE_MODELS.find((m) => m.id === id);
};

// eslint-disable-next-line react-refresh/only-export-components
export const getAllModels = (): ModelInfo[] => {
  return AVAILABLE_MODELS;
};

// eslint-disable-next-line react-refresh/only-export-components
export const getModelsByProvider = (provider: string): ModelInfo[] => {
  return AVAILABLE_MODELS.filter((m) => m.provider === provider);
};
