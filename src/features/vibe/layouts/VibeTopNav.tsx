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
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-background">
      {/* Left: Title + Dashboard Link */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            VIBE
          </h1>
        </div>

        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>Dashboard</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Right: Model Selector */}
      <div className="flex items-center gap-4">
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="claude-sonnet-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Claude Sonnet 4.5</span>
              </div>
            </SelectItem>
            <SelectItem value="gpt-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">GPT-4</span>
              </div>
            </SelectItem>
            <SelectItem value="gpt-4-turbo">
              <div className="flex items-center gap-2">
                <span className="font-medium">GPT-4 Turbo</span>
              </div>
            </SelectItem>
            <SelectItem value="gemini-pro">
              <div className="flex items-center gap-2">
                <span className="font-medium">Gemini Pro</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}
