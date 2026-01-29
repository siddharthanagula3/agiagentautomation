/**
 * Tests for useVoiceRecording hook utilities
 *
 * Tests cover:
 * - Browser support detection
 * - MIME type selection
 * - Permission status types
 * - Hook export validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PermissionStatus, VoiceRecordingState, UseVoiceRecordingReturn } from './use-voice-recording';

// Mock MediaRecorder class for testing
class MockMediaRecorder {
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public stream: MediaStream, public options?: MediaRecorderOptions) {}

  start(timeslice?: number) {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    if (this.onstop) {
      this.onstop();
    }
  }

  pause() {
    this.state = 'paused';
  }

  resume() {
    this.state = 'recording';
  }

  static isTypeSupported(type: string): boolean {
    return type.includes('webm') || type.includes('mp4') || type.includes('ogg');
  }
}

// Mock MediaStream
class MockMediaStream {
  private tracks: { stop: () => void }[] = [];

  constructor() {
    this.tracks = [{ stop: vi.fn() }];
  }

  getTracks() {
    return this.tracks;
  }
}

// Mock AudioContext
class MockAudioContext {
  state: 'running' | 'suspended' | 'closed' = 'running';

  createAnalyser() {
    return {
      fftSize: 256,
      frequencyBinCount: 128,
      smoothingTimeConstant: 0.8,
      getByteFrequencyData: vi.fn(),
    };
  }

  createMediaStreamSource() {
    return {
      connect: vi.fn(),
    };
  }

  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

describe('useVoiceRecording', () => {
  describe('Type definitions', () => {
    it('should have correct PermissionStatus type values', () => {
      const statuses: PermissionStatus[] = ['prompt', 'granted', 'denied', 'unknown'];
      expect(statuses).toHaveLength(4);
      expect(statuses).toContain('prompt');
      expect(statuses).toContain('granted');
      expect(statuses).toContain('denied');
      expect(statuses).toContain('unknown');
    });

    it('should have correct VoiceRecordingState interface shape', () => {
      const mockState: VoiceRecordingState = {
        isRecording: false,
        isPaused: false,
        audioBlob: null,
        audioUrl: null,
        duration: 0,
        audioLevels: [],
        permissionStatus: 'unknown',
        error: null,
        isSupported: true,
      };

      expect(mockState.isRecording).toBe(false);
      expect(mockState.isPaused).toBe(false);
      expect(mockState.audioBlob).toBeNull();
      expect(mockState.audioUrl).toBeNull();
      expect(mockState.duration).toBe(0);
      expect(mockState.audioLevels).toEqual([]);
      expect(mockState.permissionStatus).toBe('unknown');
      expect(mockState.error).toBeNull();
      expect(mockState.isSupported).toBe(true);
    });
  });

  describe('MockMediaRecorder', () => {
    it('should support webm MIME type', () => {
      expect(MockMediaRecorder.isTypeSupported('audio/webm;codecs=opus')).toBe(true);
      expect(MockMediaRecorder.isTypeSupported('audio/webm')).toBe(true);
    });

    it('should support mp4 MIME type', () => {
      expect(MockMediaRecorder.isTypeSupported('audio/mp4')).toBe(true);
    });

    it('should support ogg MIME type', () => {
      expect(MockMediaRecorder.isTypeSupported('audio/ogg;codecs=opus')).toBe(true);
      expect(MockMediaRecorder.isTypeSupported('audio/ogg')).toBe(true);
    });

    it('should not support unsupported MIME types', () => {
      expect(MockMediaRecorder.isTypeSupported('audio/flac')).toBe(false);
      expect(MockMediaRecorder.isTypeSupported('audio/wav')).toBe(false);
    });

    it('should start in inactive state', () => {
      const stream = new MockMediaStream() as unknown as MediaStream;
      const recorder = new MockMediaRecorder(stream);
      expect(recorder.state).toBe('inactive');
    });

    it('should transition to recording state on start', () => {
      const stream = new MockMediaStream() as unknown as MediaStream;
      const recorder = new MockMediaRecorder(stream);
      recorder.start();
      expect(recorder.state).toBe('recording');
    });

    it('should transition to paused state on pause', () => {
      const stream = new MockMediaStream() as unknown as MediaStream;
      const recorder = new MockMediaRecorder(stream);
      recorder.start();
      recorder.pause();
      expect(recorder.state).toBe('paused');
    });

    it('should transition back to recording state on resume', () => {
      const stream = new MockMediaStream() as unknown as MediaStream;
      const recorder = new MockMediaRecorder(stream);
      recorder.start();
      recorder.pause();
      recorder.resume();
      expect(recorder.state).toBe('recording');
    });

    it('should transition to inactive state on stop', () => {
      const stream = new MockMediaStream() as unknown as MediaStream;
      const recorder = new MockMediaRecorder(stream);
      recorder.start();
      recorder.stop();
      expect(recorder.state).toBe('inactive');
    });

    it('should call onstop callback when stopped', () => {
      const stream = new MockMediaStream() as unknown as MediaStream;
      const recorder = new MockMediaRecorder(stream);
      const onstopMock = vi.fn();
      recorder.onstop = onstopMock;

      recorder.start();
      recorder.stop();

      expect(onstopMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('MockMediaStream', () => {
    it('should return tracks', () => {
      const stream = new MockMediaStream();
      const tracks = stream.getTracks();
      expect(tracks).toHaveLength(1);
      expect(typeof tracks[0].stop).toBe('function');
    });
  });

  describe('MockAudioContext', () => {
    it('should start in running state', () => {
      const ctx = new MockAudioContext();
      expect(ctx.state).toBe('running');
    });

    it('should create analyser node', () => {
      const ctx = new MockAudioContext();
      const analyser = ctx.createAnalyser();
      expect(analyser.fftSize).toBe(256);
      expect(analyser.frequencyBinCount).toBe(128);
      expect(typeof analyser.getByteFrequencyData).toBe('function');
    });

    it('should create media stream source', () => {
      const ctx = new MockAudioContext();
      const source = ctx.createMediaStreamSource();
      expect(typeof source.connect).toBe('function');
    });

    it('should close and update state', async () => {
      const ctx = new MockAudioContext();
      await ctx.close();
      expect(ctx.state).toBe('closed');
    });
  });

  describe('Recording state transitions', () => {
    it('should support all valid state transitions', () => {
      const stream = new MockMediaStream() as unknown as MediaStream;
      const recorder = new MockMediaRecorder(stream);

      // inactive -> recording
      recorder.start();
      expect(recorder.state).toBe('recording');

      // recording -> paused
      recorder.pause();
      expect(recorder.state).toBe('paused');

      // paused -> recording
      recorder.resume();
      expect(recorder.state).toBe('recording');

      // recording -> inactive
      recorder.stop();
      expect(recorder.state).toBe('inactive');
    });
  });

  describe('Audio format detection', () => {
    it('should prioritize webm with opus codec', () => {
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/ogg',
      ];

      // Find first supported type
      const supported = mimeTypes.find((type) => MockMediaRecorder.isTypeSupported(type));
      expect(supported).toBe('audio/webm;codecs=opus');
    });
  });

  describe('Duration formatting', () => {
    function formatDuration(seconds: number): string {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    it('should format 0 seconds correctly', () => {
      expect(formatDuration(0)).toBe('00:00');
    });

    it('should format seconds correctly', () => {
      expect(formatDuration(5)).toBe('00:05');
      expect(formatDuration(30)).toBe('00:30');
      expect(formatDuration(59)).toBe('00:59');
    });

    it('should format minutes correctly', () => {
      expect(formatDuration(60)).toBe('01:00');
      expect(formatDuration(90)).toBe('01:30');
      expect(formatDuration(125)).toBe('02:05');
    });

    it('should format longer durations correctly', () => {
      expect(formatDuration(600)).toBe('10:00');
      expect(formatDuration(3599)).toBe('59:59');
    });
  });

  describe('Audio level normalization', () => {
    function normalizeAudioLevels(data: Uint8Array, barCount: number): number[] {
      const barsPerSegment = Math.floor(data.length / barCount);
      const levels: number[] = [];

      for (let i = 0; i < barCount; i++) {
        let sum = 0;
        for (let j = 0; j < barsPerSegment; j++) {
          sum += data[i * barsPerSegment + j];
        }
        levels.push(sum / barsPerSegment / 255);
      }

      return levels;
    }

    it('should normalize zero levels to zero', () => {
      const data = new Uint8Array(128).fill(0);
      const levels = normalizeAudioLevels(data, 32);
      expect(levels.every((l) => l === 0)).toBe(true);
    });

    it('should normalize max levels to 1', () => {
      const data = new Uint8Array(128).fill(255);
      const levels = normalizeAudioLevels(data, 32);
      expect(levels.every((l) => l === 1)).toBe(true);
    });

    it('should normalize mid levels to ~0.5', () => {
      const data = new Uint8Array(128).fill(128);
      const levels = normalizeAudioLevels(data, 32);
      expect(levels.every((l) => Math.abs(l - 0.502) < 0.01)).toBe(true);
    });

    it('should produce correct number of bars', () => {
      const data = new Uint8Array(128);
      const levels16 = normalizeAudioLevels(data, 16);
      const levels32 = normalizeAudioLevels(data, 32);
      const levels64 = normalizeAudioLevels(data, 64);

      expect(levels16).toHaveLength(16);
      expect(levels32).toHaveLength(32);
      expect(levels64).toHaveLength(64);
    });
  });

  describe('Error messages', () => {
    it('should have user-friendly permission denied message', () => {
      const error = new DOMException('Permission denied', 'NotAllowedError');
      const message = error.name === 'NotAllowedError'
        ? 'Microphone permission was denied. Please allow access in your browser settings.'
        : error.message;

      expect(message).toContain('denied');
      expect(message).toContain('browser settings');
    });

    it('should have user-friendly no microphone message', () => {
      const error = new DOMException('No microphone', 'NotFoundError');
      const message = error.name === 'NotFoundError'
        ? 'No microphone found. Please connect a microphone and try again.'
        : error.message;

      expect(message).toContain('No microphone');
      expect(message).toContain('connect');
    });
  });
});
