import React from 'react';
import { Tool } from '../../hooks/useChat';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Settings, Zap } from 'lucide-react';

interface ToolsPanelProps {
  tools: Tool[];
  selectedTools: string[];
  onToggleTool: (toolId: string) => void;
  onClearSelection: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  tools,
  selectedTools,
  onToggleTool,
  onClearSelection,
  isOpen,
  onToggle,
}) => {
  if (!isOpen) {
    return (
      <div className="border-t border-border bg-card p-4">
        <Button
          onClick={onToggle}
          variant="outline"
          className="w-full"
        >
          <Settings className="w-4 h-4 mr-2" />
          Configure Tools ({selectedTools.length} selected)
        </Button>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-card">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Available Tools</h3>
          <div className="flex items-center space-x-2">
            <Button
              onClick={onClearSelection}
              variant="ghost"
              size="sm"
              disabled={selectedTools.length === 0}
            >
              Clear All
            </Button>
            <Button
              onClick={onToggle}
              variant="ghost"
              size="sm"
            >
              Close
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Select tools for this AI employee to use
        </p>
      </div>
      
      <div className="p-4 max-h-64 overflow-y-auto">
        {tools.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No tools available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={tool.id}
                  checked={selectedTools.includes(tool.id)}
                  onCheckedChange={() => onToggleTool(tool.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <label
                      htmlFor={tool.id}
                      className="font-medium text-foreground cursor-pointer"
                    >
                      {tool.name}
                    </label>
                    <Badge variant="secondary" className="text-xs">
                      {tool.parameters ? Object.keys(tool.parameters).length : 0} params
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tool.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selectedTools.length > 0 && (
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedTools.length} tool{selectedTools.length !== 1 ? 's' : ''} selected
            </span>
            <Button
              onClick={onToggle}
              size="sm"
            >
              Apply Tools
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};