/**
 * Artifact Store Tests
 *
 * Tests for artifact version control, sharing, and management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useArtifactStore } from './artifact-store';
import type { ArtifactData } from '@features/chat/components/ArtifactPreview';

// Mock artifact data factory
const createMockArtifact = (
  overrides: Partial<ArtifactData> = {}
): ArtifactData => ({
  id: `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type: 'code',
  title: 'Test Artifact',
  content: 'console.log("hello");',
  language: 'javascript',
  ...overrides,
});

describe('Artifact Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useArtifactStore.getState().reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useArtifactStore.getState();

      expect(state.artifacts).toEqual({});
      expect(state.sharedArtifacts).toEqual({});
      expect(state.activeArtifact).toBeNull();
    });
  });

  describe('addArtifact', () => {
    it('should add artifact to a message', () => {
      const { addArtifact, getMessageArtifacts } = useArtifactStore.getState();
      const messageId = 'msg-123';
      const artifact = createMockArtifact();

      addArtifact(messageId, artifact);

      const artifacts = getMessageArtifacts(messageId);
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0]).toEqual(artifact);
    });

    it('should add multiple artifacts to same message', () => {
      const { addArtifact, getMessageArtifacts } = useArtifactStore.getState();
      const messageId = 'msg-123';

      addArtifact(messageId, createMockArtifact({ title: 'First' }));
      addArtifact(messageId, createMockArtifact({ title: 'Second' }));
      addArtifact(messageId, createMockArtifact({ title: 'Third' }));

      const artifacts = getMessageArtifacts(messageId);
      expect(artifacts).toHaveLength(3);
      expect(artifacts[0].title).toBe('First');
      expect(artifacts[1].title).toBe('Second');
      expect(artifacts[2].title).toBe('Third');
    });

    it('should add artifacts to different messages', () => {
      const { addArtifact, getMessageArtifacts } = useArtifactStore.getState();

      addArtifact('msg-1', createMockArtifact({ title: 'Msg1 Artifact' }));
      addArtifact('msg-2', createMockArtifact({ title: 'Msg2 Artifact' }));

      expect(getMessageArtifacts('msg-1')).toHaveLength(1);
      expect(getMessageArtifacts('msg-2')).toHaveLength(1);
      expect(getMessageArtifacts('msg-1')[0].title).toBe('Msg1 Artifact');
      expect(getMessageArtifacts('msg-2')[0].title).toBe('Msg2 Artifact');
    });
  });

  describe('updateArtifact', () => {
    it('should update artifact properties', () => {
      const { addArtifact, updateArtifact, getMessageArtifacts } =
        useArtifactStore.getState();
      const messageId = 'msg-123';
      const artifact = createMockArtifact();

      addArtifact(messageId, artifact);
      updateArtifact(messageId, artifact.id, {
        title: 'Updated Title',
        content: 'Updated content',
      });

      const artifacts = getMessageArtifacts(messageId);
      expect(artifacts[0].title).toBe('Updated Title');
      expect(artifacts[0].content).toBe('Updated content');
    });

    it('should handle updating non-existent artifact', () => {
      const { updateArtifact, getMessageArtifacts } =
        useArtifactStore.getState();

      // Should not throw
      expect(() => {
        updateArtifact('msg-123', 'non-existent', { title: 'Test' });
      }).not.toThrow();

      // Should remain empty
      expect(getMessageArtifacts('msg-123')).toEqual([]);
    });

    it('should handle updating artifact in non-existent message', () => {
      const { updateArtifact } = useArtifactStore.getState();

      // Should not throw
      expect(() => {
        updateArtifact('non-existent-msg', 'artifact-id', { title: 'Test' });
      }).not.toThrow();
    });
  });

  describe('Version Control', () => {
    it('should add version to artifact', () => {
      const { addArtifact, addVersion, getMessageArtifacts } =
        useArtifactStore.getState();
      const messageId = 'msg-123';
      const artifact = createMockArtifact();

      addArtifact(messageId, artifact);
      addVersion(messageId, artifact.id, {
        content: 'Version 1 content',
        timestamp: new Date(),
        description: 'Initial version',
      });

      const artifacts = getMessageArtifacts(messageId);
      expect(artifacts[0].versions).toHaveLength(1);
      expect(artifacts[0].versions![0].content).toBe('Version 1 content');
    });

    it('should add multiple versions', () => {
      const { addArtifact, addVersion, getMessageArtifacts } =
        useArtifactStore.getState();
      const messageId = 'msg-123';
      const artifact = createMockArtifact();

      addArtifact(messageId, artifact);

      addVersion(messageId, artifact.id, {
        content: 'Version 1',
        timestamp: new Date(),
      });
      addVersion(messageId, artifact.id, {
        content: 'Version 2',
        timestamp: new Date(),
      });
      addVersion(messageId, artifact.id, {
        content: 'Version 3',
        timestamp: new Date(),
      });

      const artifacts = getMessageArtifacts(messageId);
      expect(artifacts[0].versions).toHaveLength(3);
      expect(artifacts[0].currentVersion).toBe(2); // Latest version
    });

    it('should set current version', () => {
      const { addArtifact, addVersion, setCurrentVersion, getMessageArtifacts } =
        useArtifactStore.getState();
      const messageId = 'msg-123';
      const artifact = createMockArtifact();

      addArtifact(messageId, artifact);

      addVersion(messageId, artifact.id, {
        content: 'Version 0',
        timestamp: new Date(),
      });
      addVersion(messageId, artifact.id, {
        content: 'Version 1',
        timestamp: new Date(),
      });
      addVersion(messageId, artifact.id, {
        content: 'Version 2',
        timestamp: new Date(),
      });

      setCurrentVersion(messageId, artifact.id, 1);

      const artifacts = getMessageArtifacts(messageId);
      expect(artifacts[0].currentVersion).toBe(1);
      expect(artifacts[0].content).toBe('Version 1');
    });

    it('should handle invalid version index', () => {
      const { addArtifact, addVersion, setCurrentVersion, getMessageArtifacts } =
        useArtifactStore.getState();
      const messageId = 'msg-123';
      const artifact = createMockArtifact();

      addArtifact(messageId, artifact);
      addVersion(messageId, artifact.id, {
        content: 'Version 0',
        timestamp: new Date(),
      });

      // Try to set invalid version
      setCurrentVersion(messageId, artifact.id, 999);

      // Should not change
      const artifacts = getMessageArtifacts(messageId);
      expect(artifacts[0].currentVersion).toBe(0);
    });

    it('should handle negative version index', () => {
      const { addArtifact, addVersion, setCurrentVersion, getMessageArtifacts } =
        useArtifactStore.getState();
      const messageId = 'msg-123';
      const artifact = createMockArtifact();

      addArtifact(messageId, artifact);
      addVersion(messageId, artifact.id, {
        content: 'Version 0',
        timestamp: new Date(),
      });

      setCurrentVersion(messageId, artifact.id, -1);

      // Should not change
      const artifacts = getMessageArtifacts(messageId);
      expect(artifacts[0].currentVersion).toBe(0);
    });
  });

  describe('Sharing', () => {
    it('should share artifact and return share ID', async () => {
      const { addArtifact, shareArtifact } = useArtifactStore.getState();
      const messageId = 'msg-123';
      const artifact = createMockArtifact();

      addArtifact(messageId, artifact);

      vi.setSystemTime(new Date('2024-01-01'));
      const shareId = await shareArtifact(messageId, artifact.id);

      expect(shareId).toMatch(/^share-/);
    });

    it('should store shared artifact', async () => {
      const { addArtifact, shareArtifact, getSharedArtifact } =
        useArtifactStore.getState();
      const messageId = 'msg-123';
      const artifact = createMockArtifact();

      addArtifact(messageId, artifact);
      const shareId = await shareArtifact(messageId, artifact.id);

      const sharedArtifact = await getSharedArtifact(shareId);
      expect(sharedArtifact).toEqual(artifact);
    });

    it('should throw when sharing non-existent artifact', async () => {
      const { shareArtifact } = useArtifactStore.getState();

      await expect(
        shareArtifact('msg-123', 'non-existent')
      ).rejects.toThrow('Message artifacts not found');
    });

    it('should throw when artifact not found in message', async () => {
      const { addArtifact, shareArtifact } = useArtifactStore.getState();
      const messageId = 'msg-123';

      addArtifact(messageId, createMockArtifact());

      await expect(
        shareArtifact(messageId, 'non-existent-artifact')
      ).rejects.toThrow('Artifact not found');
    });

    it('should unshare artifact', async () => {
      const { addArtifact, shareArtifact, unshareArtifact, getSharedArtifact } =
        useArtifactStore.getState();
      const messageId = 'msg-123';
      const artifact = createMockArtifact();

      addArtifact(messageId, artifact);
      const shareId = await shareArtifact(messageId, artifact.id);

      expect(await getSharedArtifact(shareId)).toBeDefined();

      unshareArtifact(shareId);

      expect(await getSharedArtifact(shareId)).toBeUndefined();
    });

    it('should handle unsharing non-existent share', async () => {
      const { unshareArtifact, getSharedArtifact } =
        useArtifactStore.getState();

      // Should not throw
      expect(() => unshareArtifact('non-existent-share')).not.toThrow();
      expect(await getSharedArtifact('non-existent-share')).toBeUndefined();
    });
  });

  describe('Active Artifact', () => {
    it('should set active artifact', () => {
      const { setActiveArtifact } = useArtifactStore.getState();

      setActiveArtifact('artifact-123');
      expect(useArtifactStore.getState().activeArtifact).toBe('artifact-123');
    });

    it('should clear active artifact', () => {
      const { setActiveArtifact } = useArtifactStore.getState();

      setActiveArtifact('artifact-123');
      setActiveArtifact(null);

      expect(useArtifactStore.getState().activeArtifact).toBeNull();
    });
  });

  describe('Clear Operations', () => {
    it('should clear artifacts for specific message', () => {
      const { addArtifact, clearArtifacts, getMessageArtifacts } =
        useArtifactStore.getState();

      addArtifact('msg-1', createMockArtifact());
      addArtifact('msg-2', createMockArtifact());

      clearArtifacts('msg-1');

      expect(getMessageArtifacts('msg-1')).toEqual([]);
      expect(getMessageArtifacts('msg-2')).toHaveLength(1);
    });

    it('should clear all artifacts', async () => {
      const { addArtifact, shareArtifact, setActiveArtifact, clearAllArtifacts, getMessageArtifacts } =
        useArtifactStore.getState();

      const artifact = createMockArtifact();
      addArtifact('msg-1', artifact);
      addArtifact('msg-2', createMockArtifact());
      await shareArtifact('msg-1', artifact.id);
      setActiveArtifact('artifact-123');

      clearAllArtifacts();

      const state = useArtifactStore.getState();
      expect(state.artifacts).toEqual({});
      expect(state.sharedArtifacts).toEqual({});
      expect(state.activeArtifact).toBeNull();
    });
  });

  describe('Reset', () => {
    it('should reset to initial state', async () => {
      const { addArtifact, shareArtifact, setActiveArtifact, reset, getMessageArtifacts } =
        useArtifactStore.getState();

      const artifact = createMockArtifact();
      addArtifact('msg-1', artifact);
      await shareArtifact('msg-1', artifact.id);
      setActiveArtifact('artifact-123');

      reset();

      const state = useArtifactStore.getState();
      expect(state.artifacts).toEqual({});
      expect(state.sharedArtifacts).toEqual({});
      expect(state.activeArtifact).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message artifacts request', () => {
      const { getMessageArtifacts } = useArtifactStore.getState();

      expect(getMessageArtifacts('non-existent')).toEqual([]);
    });

    it('should handle adding version to artifact without versions array', () => {
      const { addArtifact, addVersion, getMessageArtifacts } =
        useArtifactStore.getState();
      const messageId = 'msg-123';
      const artifact = createMockArtifact();
      // Ensure no versions array - use type assertion with Partial to allow deletion
      delete (artifact as Partial<ArtifactData>).versions;

      addArtifact(messageId, artifact);
      addVersion(messageId, artifact.id, {
        content: 'New version',
        timestamp: new Date(),
      });

      const artifacts = getMessageArtifacts(messageId);
      expect(artifacts[0].versions).toBeDefined();
      expect(artifacts[0].versions).toHaveLength(1);
    });

    it('should handle concurrent operations', async () => {
      const { addArtifact, updateArtifact, addVersion, getMessageArtifacts } =
        useArtifactStore.getState();
      const messageId = 'msg-123';
      const artifact = createMockArtifact();

      addArtifact(messageId, artifact);

      // Simulate concurrent operations
      updateArtifact(messageId, artifact.id, { title: 'Updated' });
      addVersion(messageId, artifact.id, {
        content: 'V1',
        timestamp: new Date(),
      });
      updateArtifact(messageId, artifact.id, { language: 'typescript' });

      const artifacts = getMessageArtifacts(messageId);
      expect(artifacts[0].title).toBe('Updated');
      expect(artifacts[0].language).toBe('typescript');
      expect(artifacts[0].versions).toHaveLength(1);
    });
  });
});
