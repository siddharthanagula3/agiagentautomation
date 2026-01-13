import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ExternalLink } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useVibeChatStore } from '../stores/vibe-chat-store';

export function VibeTopNav() {
  const { selectedModel, setSelectedModel } = useVibeChatStore();

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-background px-6 dark:border-gray-800">
      {/* Left: Title + Dashboard Link */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent">
            VIBE
          </h1>
        </div>

        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span>Dashboard</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Right: Model Selector */}
      <div className="flex items-center gap-4">
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="claude-sonnet-4-20250514">
              <div className="flex items-center gap-2">
                <span className="font-medium">Claude Sonnet 4</span>
              </div>
            </SelectItem>
            <SelectItem value="claude-3-5-sonnet-20241022">
              <div className="flex items-center gap-2">
                <span className="font-medium">Claude 3.5 Sonnet</span>
              </div>
            </SelectItem>
            <SelectItem value="gpt-4o">
              <div className="flex items-center gap-2">
                <span className="font-medium">GPT-4o</span>
              </div>
            </SelectItem>
            <SelectItem value="gemini-2.0-flash">
              <div className="flex items-center gap-2">
                <span className="font-medium">Gemini 2.0 Flash</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}
