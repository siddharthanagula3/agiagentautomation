import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Wrench } from 'lucide-react';

interface Tool {
  name: string;
  description?: string;
  category?: string;
}

interface ToolsPanelProps {
  showTools: boolean;
  availableTools: Tool[];
  onToolSelect: (tool: Tool) => void;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  showTools,
  availableTools,
  onToolSelect,
}) => {
  return (
    <AnimatePresence>
      {showTools && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t bg-card"
        >
          <div className="p-4">
            <h3 className="text-sm font-medium mb-3">Available Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              {availableTools.map((tool, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onToolSelect(tool)}
                  className="justify-start"
                >
                  <Wrench className="h-3 w-3 mr-2" />
                  {tool.name}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
