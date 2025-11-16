import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { GripVertical } from 'lucide-react';
import { useVibeViewStore } from '../stores/vibe-view-store';

interface VibeSplitViewProps {
  children: [React.ReactNode, React.ReactNode]; // [leftPanel, rightPanel]
}

/**
 * Resizable split view for VIBE workspace
 * Left panel: Agent process and messages
 * Right panel: Output views (Editor, Planner, App Viewer, Terminal, File Tree)
 */
export function VibeSplitView({ children }: VibeSplitViewProps) {
  const { splitLayout, updateSplitLayout } = useVibeViewStore();
  const [leftPanel, rightPanel] = children;

  const handleResize = (sizes: number[]) => {
    updateSplitLayout(sizes[0]);
  };

  return (
    <PanelGroup
      direction="horizontal"
      onLayout={handleResize}
      className="h-full w-full"
    >
      {/* Left Panel - Agent Process */}
      <Panel
        defaultSize={splitLayout.leftWidth}
        minSize={30}
        maxSize={60}
        className="h-full"
      >
        <div className="h-full overflow-hidden bg-background">
          {leftPanel}
        </div>
      </Panel>

      {/* Resize Handle */}
      <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors relative group">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="p-1 bg-background border border-border rounded-sm shadow-lg">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </PanelResizeHandle>

      {/* Right Panel - Output Views */}
      <Panel
        defaultSize={splitLayout.rightWidth}
        minSize={40}
        maxSize={70}
        className="h-full"
      >
        <div className="h-full overflow-hidden bg-muted/30">
          {rightPanel}
        </div>
      </Panel>
    </PanelGroup>
  );
}
