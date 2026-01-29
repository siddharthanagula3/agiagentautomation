import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
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
  // Updated: Jan 15th 2026 - Fixed any type
  metadata?: Record<string, unknown>;
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
  addTerminalCommand: (
    command: Omit<TerminalCommand, 'id' | 'timestamp'>
  ) => string;
  updateTerminalCommand: (
    id: string,
    updates: Partial<TerminalCommand>
  ) => void;
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
  fileMetadata: Record<string, FileMetadata>;
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
  fileMetadata: {} as Record<string, FileMetadata>,
};

// Only enable devtools in development/staging, not production
const enableDevtools = import.meta.env.MODE !== 'production';

export const useVibeViewStore = create<VibeViewStore>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        // View management
        setActiveView: (view) =>
          set((state) => {
            state.activeView = view;
          }),

        // Split layout
        updateSplitLayout: (leftWidth) =>
          set((state) => {
            state.splitLayout.leftWidth = leftWidth;
            state.splitLayout.rightWidth = 100 - leftWidth;
          }),

        // Following agent
        toggleFollowAgent: () =>
          set((state) => {
            state.followingAgent = !state.followingAgent;
          }),

        setFollowingAgent: (following) =>
          set((state) => {
            state.followingAgent = following;
          }),

        // Editor state
        updateEditorState: (updates) =>
          set((state) => {
            state.editorState = { ...state.editorState, ...updates };
          }),

        openFile: (filePath, content, language) =>
          set((state) => {
            if (!state.editorState.openFiles.includes(filePath)) {
              state.editorState.openFiles.push(filePath);
            }
            state.editorState.currentFile = filePath;
            state.editorState.content = content;
            state.editorState.language = language;
          }),

        closeFile: (filePath) =>
          set((state) => {
            state.editorState.openFiles = state.editorState.openFiles.filter(
              (f) => f !== filePath
            );
            if (state.editorState.currentFile === filePath) {
              state.editorState.currentFile =
                state.editorState.openFiles[0] || null;
            }
          }),

        setCurrentFile: (filePath) =>
          set((state) => {
            state.editorState.currentFile = filePath;
          }),

        updateEditorContent: (content) =>
          set((state) => {
            state.editorState.content = content;
          }),

        updateCursor: (line, column) =>
          set((state) => {
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

        updateTerminalCommand: (id, updates) =>
          set((state) => {
            const commandIndex = state.terminalState.history.findIndex(
              (c) => c.id === id
            );
            if (commandIndex !== -1) {
              state.terminalState.history[commandIndex] = {
                ...state.terminalState.history[commandIndex],
                ...updates,
              };
            }
            if (updates.status === 'completed' || updates.status === 'failed') {
              state.terminalState.activeCommand = null;
            }
          }),

        clearTerminalHistory: () =>
          set((state) => {
            state.terminalState.history = [];
            state.terminalState.activeCommand = null;
          }),

        // App Viewer state
        updateAppViewerState: (updates) =>
          set((state) => {
            state.appViewerState = { ...state.appViewerState, ...updates };
          }),

        setAppViewerUrl: (url) =>
          set((state) => {
            state.appViewerState.url = url;
            state.appViewerState.isLoading = true;
          }),

        setViewport: (viewport) =>
          set((state) => {
            state.appViewerState.viewport = viewport;
          }),

        // Planner state
        updatePlannerState: (updates) =>
          set((state) => {
            state.plannerState = { ...state.plannerState, ...updates };
          }),

        addTask: (task) =>
          set((state) => {
            state.plannerState.tasks.push(task);
          }),

        updateTask: (taskId, updates) =>
          set((state) => {
            const taskIndex = state.plannerState.tasks.findIndex(
              (t) => t.id === taskId
            );
            if (taskIndex !== -1) {
              state.plannerState.tasks[taskIndex] = {
                ...state.plannerState.tasks[taskIndex],
                ...updates,
              };
            }
          }),

        setCurrentTask: (taskId) =>
          set((state) => {
            state.plannerState.currentTaskId = taskId;
          }),

        // File tree
        setFileTree: (tree) =>
          set((state) => {
            state.fileTree = tree;
          }),

        expandFolder: (folderId) =>
          set((state) => {
            // Recursively find and expand the folder
            const expandInTree = (items: FileTreeItem[]): boolean => {
              for (const item of items) {
                if (item.id === folderId && item.type === 'folder') {
                  // Store expanded state in metadata
                  if (!item.metadata) {
                    item.metadata = {};
                  }
                  item.metadata.isExpanded = true;
                  return true;
                }
                if (item.children && expandInTree(item.children)) {
                  return true;
                }
              }
              return false;
            };
            expandInTree(state.fileTree);
          }),

        collapseFolder: (folderId) =>
          set((state) => {
            // Recursively find and collapse the folder
            const collapseInTree = (items: FileTreeItem[]): boolean => {
              for (const item of items) {
                if (item.id === folderId && item.type === 'folder') {
                  // Store collapsed state in metadata
                  if (!item.metadata) {
                    item.metadata = {};
                  }
                  item.metadata.isExpanded = false;
                  return true;
                }
                if (item.children && collapseInTree(item.children)) {
                  return true;
                }
              }
              return false;
            };
            collapseInTree(state.fileTree);
          }),

        setFileMetadata: (metadata) =>
          set((state) => {
            state.fileMetadata = Object.fromEntries(
              metadata.map((entry) => [entry.path, entry])
            );
          }),

        upsertFileMetadata: (metadata) =>
          set((state) => {
            state.fileMetadata[metadata.path] = metadata;
          }),

        removeFileMetadata: (path) =>
          set((state) => {
            delete state.fileMetadata[path];
          }),

        getFileMetadata: (path) => {
          // Cannot use get() inside immer middleware
          // This function should be called from outside the store
          const state = useVibeViewStore.getState();
          return state.fileMetadata[path];
        },

        // Reset
        resetViewState: () =>
          set(() => ({
            ...initialState,
            fileMetadata: {} as Record<string, FileMetadata>,
          })),
      })),
      {
        name: 'vibe-view-store',
        version: 1,
        storage: createJSONStorage(() => localStorage),
        // Only persist user preferences, not session-specific data
        partialize: (state) => ({
          // Editor preferences (not content or open files - those are session-specific)
          splitLayout: state.splitLayout,
          followingAgent: state.followingAgent,
          // App viewer preferences (viewport size preference, not URL)
          appViewerState: {
            viewport: state.appViewerState.viewport,
          },
        }),
        // Migration support for future schema changes
        migrate: (persistedState, version) => {
          if (version === 0) {
            // Future migrations can be added here
          }
          return persistedState as VibeViewStore;
        },
      }
    ),
    {
      name: 'Vibe View Store',
      enabled: enableDevtools,
    }
  )
);
