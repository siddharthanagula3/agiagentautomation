import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  ArtifactData,
  ArtifactVersion,
} from '@features/chat/components/ArtifactPreview';

/**
 * Artifact Store - Version Control & Sharing for Chat Artifacts
 *
 * Manages artifacts (code, apps, documents) generated in chat with:
 * - Version control (like Git for artifacts)
 * - Instant sharing (generate shareable links)
 * - Export to multiple formats
 * - Artifact history across sessions
 */

interface ArtifactState {
  // Artifacts by message ID
  artifacts: Map<string, ArtifactData[]>;

  // Shared artifacts (public access)
  sharedArtifacts: Map<string, ArtifactData>;

  // Current artifact being viewed in fullscreen
  activeArtifact: string | null;

  // Actions
  addArtifact: (messageId: string, artifact: ArtifactData) => void;
  updateArtifact: (
    messageId: string,
    artifactId: string,
    updates: Partial<ArtifactData>
  ) => void;
  addVersion: (
    messageId: string,
    artifactId: string,
    version: ArtifactVersion
  ) => void;
  setCurrentVersion: (
    messageId: string,
    artifactId: string,
    versionIndex: number
  ) => void;
  shareArtifact: (messageId: string, artifactId: string) => Promise<string>;
  unshareArtifact: (shareId: string) => void;
  getSharedArtifact: (shareId: string) => ArtifactData | undefined;
  setActiveArtifact: (artifactId: string | null) => void;
  getMessageArtifacts: (messageId: string) => ArtifactData[];
  clearArtifacts: (messageId: string) => void;
  clearAllArtifacts: () => void;
}

export const useArtifactStore = create<ArtifactState>()(
  immer((set, get) => ({
    artifacts: new Map(),
    sharedArtifacts: new Map(),
    activeArtifact: null,

    addArtifact: (messageId: string, artifact: ArtifactData) => {
      set((state) => {
        const messageArtifacts = state.artifacts.get(messageId) || [];
        messageArtifacts.push(artifact);
        state.artifacts.set(messageId, messageArtifacts);
      });
    },

    updateArtifact: (
      messageId: string,
      artifactId: string,
      updates: Partial<ArtifactData>
    ) => {
      set((state) => {
        const messageArtifacts = state.artifacts.get(messageId);
        if (!messageArtifacts) return;

        const artifactIndex = messageArtifacts.findIndex(
          (a) => a.id === artifactId
        );
        if (artifactIndex === -1) return;

        messageArtifacts[artifactIndex] = {
          ...messageArtifacts[artifactIndex],
          ...updates,
        };
      });
    },

    addVersion: (
      messageId: string,
      artifactId: string,
      version: ArtifactVersion
    ) => {
      set((state) => {
        const messageArtifacts = state.artifacts.get(messageId);
        if (!messageArtifacts) return;

        const artifact = messageArtifacts.find((a) => a.id === artifactId);
        if (!artifact) return;

        if (!artifact.versions) {
          artifact.versions = [];
        }
        artifact.versions.push(version);
        artifact.currentVersion = artifact.versions.length - 1;
      });
    },

    setCurrentVersion: (
      messageId: string,
      artifactId: string,
      versionIndex: number
    ) => {
      set((state) => {
        const messageArtifacts = state.artifacts.get(messageId);
        if (!messageArtifacts) return;

        const artifact = messageArtifacts.find((a) => a.id === artifactId);
        if (!artifact || !artifact.versions) return;

        if (versionIndex >= 0 && versionIndex < artifact.versions.length) {
          artifact.currentVersion = versionIndex;
          artifact.content = artifact.versions[versionIndex].content;
        }
      });
    },

    shareArtifact: async (
      messageId: string,
      artifactId: string
    ): Promise<string> => {
      const messageArtifacts = get().artifacts.get(messageId);
      if (!messageArtifacts) {
        throw new Error('Message artifacts not found');
      }

      const artifact = messageArtifacts.find((a) => a.id === artifactId);
      if (!artifact) {
        throw new Error('Artifact not found');
      }

      // Generate unique share ID
      const shareId = `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      set((state) => {
        state.sharedArtifacts.set(shareId, artifact);
      });

      // In production, this would call an API to create a shareable link
      // For now, return a local share ID
      return shareId;
    },

    unshareArtifact: (shareId: string) => {
      set((state) => {
        state.sharedArtifacts.delete(shareId);
      });
    },

    getSharedArtifact: (shareId: string) => {
      return get().sharedArtifacts.get(shareId);
    },

    setActiveArtifact: (artifactId: string | null) => {
      set({ activeArtifact: artifactId });
    },

    getMessageArtifacts: (messageId: string) => {
      return get().artifacts.get(messageId) || [];
    },

    clearArtifacts: (messageId: string) => {
      set((state) => {
        state.artifacts.delete(messageId);
      });
    },

    clearAllArtifacts: () => {
      set({
        artifacts: new Map(),
        sharedArtifacts: new Map(),
        activeArtifact: null,
      });
    },
  }))
);
