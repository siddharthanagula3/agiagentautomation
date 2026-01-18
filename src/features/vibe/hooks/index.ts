/**
 * Vibe Hooks Index
 * Central export for all VIBE custom hooks
 */

export { useVibeChat } from './use-vibe-chat';
export { useAgentSelection } from './use-agent-selection';
export { useFileUpload } from './use-file-upload';
export { useAutocomplete } from './use-autocomplete';
export { useStreamingResponse } from './use-streaming-response';

// VibeSDK Integration Hook
export {
  useVibeSDK,
  type UseVibeSDKOptions,
  type UseVibeSDKReturn,
} from './use-vibe-sdk';
