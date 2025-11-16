import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type ViewMode = 'editor' | 'app-viewer';

export interface EditorState {
  currentFile: string | null;
  openFiles: string[];
  cursor: { line: number; column: number };
  content: string;
  language: string;
}

export interface TerminalState {
  history: TerminalCommand[];
  activeCommand: string | null;
}

export interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  status: 'running' | 'completed' | 'failed';
  timestamp: Date;
  exitCode?: number;
}

export interface AppViewerState {
  url: string | null;
  viewport: 'mobile' | 'tablet' | 'desktop';
  isLoading: boolean;
}

export interface PlannerState {
  tasks: PlannerTask[];
  currentTaskId: string | null;
}

export interface PlannerTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo: string;
  dependencies: string[];
  progress: number;
  estimatedTime?: string;
}

export interface FileTreeItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileTreeItem[];
  size?: number;
  modified?: Date;
  metadata?: Record<string, any>;
}

export interface FileMetadata {
  id: string;
  name: string;
  path: string;
  url: string;
  size?: number;
  uploadedAt?: Date;
  modifiedAt?: Date;
  language?: string;
  [key: string]: unknown;
}

interface VibeViewStore {
  // Active view
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;

  // Split layout
  splitLayout: {
    leftWidth: number; // percentage
    rightWidth: number;
  };
  updateSplitLayout: (leftWidth: number) => void;

  // Following agent mode
  followingAgent: boolean;
  toggleFollowAgent: () => void;
  setFollowingAgent: (following: boolean) => void;

  // Editor state
  editorState: EditorState;
  updateEditorState: (updates: Partial<EditorState>) => void;
  openFile: (filePath: string, content: string, language: string) => void;
  closeFile: (filePath: string) => void;
  setCurrentFile: (filePath: string | null) => void;
  updateEditorContent: (content: string) => void;
  updateCursor: (line: number, column: number) => void;

  // Terminal state
  terminalState: TerminalState;
  addTerminalCommand: (command: Omit<TerminalCommand, 'id' | 'timestamp'>) => string;
  updateTerminalCommand: (id: string, updates: Partial<TerminalCommand>) => void;
  clearTerminalHistory: () => void;

  // App Viewer state
  appViewerState: AppViewerState;
  updateAppViewerState: (updates: Partial<AppViewerState>) => void;
  setAppViewerUrl: (url: string) => void;
  setViewport: (viewport: 'mobile' | 'tablet' | 'desktop') => void;

  // Planner state
  plannerState: PlannerState;
  updatePlannerState: (updates: Partial<PlannerState>) => void;
  addTask: (task: PlannerTask) => void;
  updateTask: (taskId: string, updates: Partial<PlannerTask>) => void;
  setCurrentTask: (taskId: string | null) => void;

  // File tree
  fileTree: FileTreeItem[];
  setFileTree: (tree: FileTreeItem[]) => void;
  expandFolder: (folderId: string) => void;
  collapseFolder: (folderId: string) => void;
  fileMetadata: Map<string, FileMetadata>;
  setFileMetadata: (metadata: FileMetadata[]) => void;
  upsertFileMetadata: (metadata: FileMetadata) => void;
  removeFileMetadata: (path: string) => void;
  getFileMetadata: (path: string) => FileMetadata | undefined;

  // Reset all state
  resetViewState: () => void;
}

const initialState = {
  activeView: 'editor' as ViewMode,
  splitLayout: {
    leftWidth: 40,
    rightWidth: 60,
  },
  followingAgent: false,
  editorState: {
    currentFile: null,
    openFiles: [],
    cursor: { line: 1, column: 1 },
    content: '',
    language: 'typescript',
  },
  terminalState: {
    history: [],
    activeCommand: null,
  },
  appViewerState: {
    url: null,
    viewport: 'desktop' as const,
    isLoading: false,
  },
  plannerState: {
    tasks: [],
    currentTaskId: null,
  },
  fileTree: [],
  fileMetadata: new Map<string, FileMetadata>(),
};

export const useVibeViewStore = create<VibeViewStore>()(
  immer((set) => ({
    ...initialState,

    // View management
    setActiveView: (view) => set((state) => {
      state.activeView = view;
    }),

    // Split layout
    updateSplitLayout: (leftWidth) => set((state) => {
      state.splitLayout.leftWidth = leftWidth;
      state.splitLayout.rightWidth = 100 - leftWidth;
    }),

    // Following agent
    toggleFollowAgent: () => set((state) => {
      state.followingAgent = !state.followingAgent;
    }),

    setFollowingAgent: (following) => set((state) => {
      state.followingAgent = following;
    }),

    // Editor state
    updateEditorState: (updates) => set((state) => {
      state.editorState = { ...state.editorState, ...updates };
    }),

    openFile: (filePath, content, language) => set((state) => {
      if (!state.editorState.openFiles.includes(filePath)) {
        state.editorState.openFiles.push(filePath);
      }
      state.editorState.currentFile = filePath;
      state.editorState.content = content;
      state.editorState.language = language;
    }),

    closeFile: (filePath) => set((state) => {
      state.editorState.openFiles = state.editorState.openFiles.filter(
        (f) => f !== filePath
      );
      if (state.editorState.currentFile === filePath) {
        state.editorState.currentFile = state.editorState.openFiles[0] || null;
      }
    }),

    setCurrentFile: (filePath) => set((state) => {
      state.editorState.currentFile = filePath;
    }),

    updateEditorContent: (content) => set((state) => {
      state.editorState.content = content;
    }),

    updateCursor: (line, column) => set((state) => {
      state.editorState.cursor = { line, column };
    }),

    // Terminal state
    addTerminalCommand: (command) => {
      let commandId = '';
      set((state) => {
        const newCommand: TerminalCommand = {
          ...command,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };
        commandId = newCommand.id;
        state.terminalState.history.push(newCommand);
        state.terminalState.activeCommand = newCommand.id;
      });
      return commandId;
    },

    updateTerminalCommand: (id, updates) => set((state) => {
      const command = state.terminalState.history.find((c) => c.id === id);
      if (command) {
        Object.assign(command, updates);
      }
      if (updates.status === 'completed' || updates.status === 'failed') {
        state.terminalState.activeCommand = null;
      }
    }),

    clearTerminalHistory: () => set((state) => {
      state.terminalState.history = [];
      state.terminalState.activeCommand = null;
    }),

    // App Viewer state
    updateAppViewerState: (updates) => set((state) => {
      state.appViewerState = { ...state.appViewerState, ...updates };
    }),

    setAppViewerUrl: (url) => set((state) => {
      state.appViewerState.url = url;
      state.appViewerState.isLoading = true;
    }),

    setViewport: (viewport) => set((state) => {
      state.appViewerState.viewport = viewport;
    }),

    // Planner state
    updatePlannerState: (updates) => set((state) => {
      state.plannerState = { ...state.plannerState, ...updates };
    }),

    addTask: (task) => set((state) => {
      state.plannerState.tasks.push(task);
    }),

    updateTask: (taskId, updates) => set((state) => {
      const task = state.plannerState.tasks.find((t) => t.id === taskId);
      if (task) {
        Object.assign(task, updates);
      }
    }),

    setCurrentTask: (taskId) => set((state) => {
      state.plannerState.currentTaskId = taskId;
    }),

    // File tree
    setFileTree: (tree) => set((state) => {
      state.fileTree = tree;
    }),

    expandFolder: (folderId) => set((state) => {
      // Implementation for expanding folders in tree
      // This would need recursive logic to find and update the folder
    }),

    collapseFolder: (folderId) => set((state) => {
      // Implementation for collapsing folders in tree
    }),

    setFileMetadata: (metadata) => set((state) => {
      state.fileMetadata = new Map(
        metadata.map((entry) => [entry.path, entry])
      );
    }),

    upsertFileMetadata: (metadata) => set((state) => {
      state.fileMetadata.set(metadata.path, metadata);
    }),

    removeFileMetadata: (path) => set((state) => {
      state.fileMetadata.delete(path);
    }),

    getFileMetadata: (path) => {
      return get().fileMetadata.get(path);
    },

    // Reset
    resetViewState: () =>
      set(() => ({
        ...initialState,
        fileMetadata: new Map<string, FileMetadata>(),
      })),
  }))
);
