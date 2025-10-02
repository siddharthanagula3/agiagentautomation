import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Wrench,
  Search,
  Code,
  FileText,
  BarChart3,
  Webhook,
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
}

interface ToolsPanelProps {
  selectedTools: string[];
  onToolsChange: (tools: string[]) => void;
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({ selectedTools, onToolsChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const availableTools: Tool[] = [
    {
      id: 'web_search',
      name: 'Web Search',
      description: 'Search the web for current information',
      icon: Search,
      enabled: true
    },
    {
      id: 'code_interpreter',
      name: 'Code Interpreter',
      description: 'Execute code in sandbox',
      icon: Code,
      enabled: true
    },
    {
      id: 'analyze_file',
      name: 'File Analysis',
      description: 'Analyze uploaded files',
      icon: FileText,
      enabled: true
    },
    {
      id: 'create_visualization',
      name: 'Data Visualization',
      description: 'Create charts and graphs',
      icon: BarChart3,
      enabled: true
    },
    {
      id: 'api_call',
      name: 'API Calls',
      description: 'Make HTTP requests',
      icon: Webhook,
      enabled: true
    }
  ];

  const toggleTool = (toolId: string) => {
    if (selectedTools.includes(toolId)) {
      onToolsChange(selectedTools.filter(id => id !== toolId));
    } else {
      onToolsChange([...selectedTools, toolId]);
    }
  };

  const toggleAll = () => {
    if (selectedTools.length === availableTools.length) {
      onToolsChange([]);
    } else {
      onToolsChange(availableTools.map(t => t.id));
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 transition-all",
            selectedTools.length > 0 && "border-primary/50 bg-primary/5"
          )}
        >
          <Wrench className="h-4 w-4" />
          Tools
          {selectedTools.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {selectedTools.length}
            </Badge>
          )}
          <ChevronDown className={cn(
            "h-3 w-3 transition-transform",
            isOpen && "rotate-180"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="border-b border-border/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Available Tools</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAll}
              className="h-7 text-xs"
            >
              {selectedTools.length === availableTools.length ? (
                <>
                  <X className="mr-1 h-3 w-3" />
                  Clear All
                </>
              ) : (
                <>
                  <Check className="mr-1 h-3 w-3" />
                  Select All
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enable tools for the AI to use during the conversation
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          <AnimatePresence>
            {availableTools.map((tool, idx) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className={cn(
                    "p-3 mb-2 cursor-pointer transition-all border",
                    selectedTools.includes(tool.id)
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/40 hover:border-border"
                  )}
                  onClick={() => toggleTool(tool.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        selectedTools.includes(tool.id)
                          ? "bg-primary/20"
                          : "bg-accent"
                      )}>
                        <tool.icon className={cn(
                          "h-4 w-4",
                          selectedTools.includes(tool.id)
                            ? "text-primary"
                            : "text-muted-foreground"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="text-sm font-medium truncate">
                            {tool.name}
                          </h5>
                          {selectedTools.includes(tool.id) && (
                            <Check className="h-3 w-3 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={selectedTools.includes(tool.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTool(tool.id);
                      }}
                    />
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="border-t border-border/40 p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Selected tools will be available in your conversation
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { ToolsPanel };
