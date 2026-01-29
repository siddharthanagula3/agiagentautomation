/**
 * useVoiceRecording - Hook for voice recording functionality
 *
 * Features:
 * - MediaRecorder API for audio capture
 * - Web Audio API for real-time visualization data
 * - Support for start/stop/pause/resume recording
 * - Returns audio blob when recording is complete
 * - Handles microphone permission requests
 * - Provides real-time audio levels for visualization
 *
 * @example
 * const {
 *   isRecording,
 *   isPaused,
 *   audioBlob,
 *   duration,
 *   audioLevels,
 *   startRecording,
 *   stopRecording,
 *   pauseRecording,
 *   resumeRecording,
 *   clearRecording,
 *   permissionStatus,
 *   error,
 * } = useVoiceRecording();
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unknown';

export interface VoiceRecordingState {
  /** Whether currently recording */
  isRecording: boolean;
  /** Whether recording is paused */
  isPaused: boolean;
  /** The recorded audio blob (null until recording stops) */
  audioBlob: Blob | null;
  /** Audio URL for playback (null until recording stops) */
  audioUrl: string | null;
  /** Recording duration in seconds */
  duration: number;
  /** Real-time audio levels for visualization (0-1 range) */
  audioLevels: number[];
  /** Current microphone permission status */
  permissionStatus: PermissionStatus;
  /** Error message if any */
  error: string | null;
  /** Whether the browser supports audio recording */
  isSupported: boolean;
}

export interface VoiceRecordingActions {
  /** Start recording audio */
  startRecording: () => Promise<void>;
  /** Stop recording and get the audio blob */
  stopRecording: () => Promise<Blob | null>;
  /** Pause the current recording */
  pauseRecording: () => void;
  /** Resume a paused recording */
  resumeRecording: () => void;
  /** Clear the recorded audio and reset state */
  clearRecording: () => void;
  /** Request microphone permission without recording */
  requestPermission: () => Promise<boolean>;
}

export type UseVoiceRecordingReturn = VoiceRecordingState & VoiceRecordingActions;

// Audio configuration
const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 44100,
};

// Preferred MIME types in order of preference
const MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
];

/**
 * Get the best supported MIME type for audio recording
 */
function getSupportedMimeType(): string {
  for (const mimeType of MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return ''; // Let browser choose default
}

/**
 * Check if the browser supports audio recording
 */
function checkBrowserSupport(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.MediaRecorder &&
    window.AudioContext
  );
}

export function useVoiceRecording(): UseVoiceRecordingReturn {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('unknown');
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => checkBrowserSupport());

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Clear duration interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Stop and close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear media recorder
    mediaRecorderRef.current = null;
    analyserRef.current = null;
    chunksRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      // Revoke any existing audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [cleanup, audioUrl]);

  // Check permission status on mount
  useEffect(() => {
    let permissionResult: PermissionStatus | null = null;
    let isMounted = true;

    const handlePermissionChange = () => {
      if (isMounted && permissionResult) {
        setPermissionStatus(permissionResult.state as PermissionStatus);
      }
    };

    const checkPermission = async () => {
      if (!isSupported) {
        setPermissionStatus('denied');
        return;
      }

      try {
        const result = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        });

        if (!isMounted) return;

        permissionResult = result;
        setPermissionStatus(result.state as PermissionStatus);

        // Listen for permission changes
        result.addEventListener('change', handlePermissionChange);
      } catch {
        // Some browsers don't support permissions API for microphone
        if (isMounted) {
          setPermissionStatus('unknown');
        }
      }
    };

    checkPermission();

    // Cleanup: remove event listener on unmount
    return () => {
      isMounted = false;
      if (permissionResult) {
        permissionResult.removeEventListener('change', handlePermissionChange);
      }
    };
  }, [isSupported]);

  // Update audio levels for visualization
  const updateAudioLevels = useCallback(() => {
    if (!analyserRef.current || !isRecording || isPaused) {
      return;
    }

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Calculate average levels for visualization (reduce to ~32 bars)
    const barCount = 32;
    const barsPerSegment = Math.floor(dataArray.length / barCount);
    const levels: number[] = [];

    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      for (let j = 0; j < barsPerSegment; j++) {
        sum += dataArray[i * barsPerSegment + j];
      }
      // Normalize to 0-1 range
      levels.push(sum / barsPerSegment / 255);
    }

    setAudioLevels(levels);

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
  }, [isRecording, isPaused]);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Audio recording is not supported in this browser');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: AUDIO_CONSTRAINTS,
      });
      // Permission granted - stop the stream immediately
      stream.getTracks().forEach((track) => track.stop());
      setPermissionStatus('granted');
      setError(null);
      return true;
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionStatus('denied');
          setError('Microphone permission was denied. Please allow access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.');
        } else {
          setError(`Failed to access microphone: ${err.message}`);
        }
      } else {
        setError('An unexpected error occurred while requesting microphone access');
      }
      return false;
    }
  }, [isSupported]);

  // Start recording
  const startRecording = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      setError('Audio recording is not supported in this browser');
      return;
    }

    if (isRecording) {
      return;
    }

    setError(null);

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: AUDIO_CONSTRAINTS,
      });
      streamRef.current = stream;
      setPermissionStatus('granted');

      // Create audio context for visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Create analyser for audio levels
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Connect stream to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Create media recorder
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
      });
      mediaRecorderRef.current = mediaRecorder;

      // Clear previous chunks
      chunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm',
        });
        setAudioBlob(blob);

        // Create URL for playback
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Cleanup
        cleanup();
        setIsRecording(false);
        setIsPaused(false);
      };

      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('An error occurred during recording');
        cleanup();
        setIsRecording(false);
        setIsPaused(false);
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();
      pausedDurationRef.current = 0;

      // Clear any existing audio
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioBlob(null);
      setAudioUrl(null);

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        if (!isPaused) {
          const elapsed = (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000;
          setDuration(Math.floor(elapsed));
        }
      }, 100);

      // Start audio level visualization
      animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionStatus('denied');
          setError('Microphone permission was denied. Please allow access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.');
        } else {
          setError(`Failed to start recording: ${err.message}`);
        }
      } else {
        setError('An unexpected error occurred while starting recording');
      }
      cleanup();
    }
  }, [isSupported, isRecording, isPaused, audioUrl, cleanup, updateAudioLevels]);

  // Stop recording
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve(audioBlob);
        return;
      }

      const mediaRecorder = mediaRecorderRef.current;

      // Override onstop to resolve the promise
      const originalOnStop = mediaRecorder.onstop;
      mediaRecorder.onstop = (event) => {
        if (originalOnStop) {
          originalOnStop.call(mediaRecorder, event);
        }

        // Get the blob after a small delay to ensure state is updated
        setTimeout(() => {
          const mimeType = getSupportedMimeType();
          const blob = new Blob(chunksRef.current, {
            type: mimeType || 'audio/webm',
          });
          resolve(blob);
        }, 50);
      };

      mediaRecorder.stop();
    });
  }, [isRecording, audioBlob]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording || isPaused) {
      return;
    }

    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      // Track pause time for accurate duration
      pausedDurationRef.current = Date.now() - startTimeRef.current - duration * 1000;

      // Stop audio level updates
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [isRecording, isPaused, duration]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording || !isPaused) {
      return;
    }

    if (mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Resume audio level updates
      animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
    }
  }, [isRecording, isPaused, updateAudioLevels]);

  // Clear recording and reset state
  const clearRecording = useCallback(() => {
    // Stop any ongoing recording
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    // Revoke audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    // Reset state
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setAudioLevels([]);
    setError(null);
    setIsRecording(false);
    setIsPaused(false);

    // Cleanup resources
    cleanup();
  }, [isRecording, audioUrl, cleanup]);

  return {
    // State
    isRecording,
    isPaused,
    audioBlob,
    audioUrl,
    duration,
    audioLevels,
    permissionStatus,
    error,
    isSupported,
    // Actions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    requestPermission,
  };
}

export default useVoiceRecording;
