// Chat Hooks - Public API

export { useMultiAgentChat } from './use-multi-agent-chat';
export { useSessionTokens } from './use-session-tokens';
export { useKeyboardShortcuts } from './use-keyboard-shortcuts';
export { useAIPreferences } from './use-ai-preferences';
export { useToolIntegration } from './use-tool-integration';
export { useExportConversation } from './use-export-conversation';
export { useAgentCollaboration } from './use-agent-collaboration';
export { useChatPersistence } from './use-chat-persistence';
export { useChatInterface } from './use-chat-interface';
export * from './use-chat-queries';
export { useConversationHistory } from './use-conversation-history';
export { useVoiceRecording } from './use-voice-recording';
export { useMessageReactions } from './use-message-reactions';
export {
  // Legacy hook (useState based)
  useConversationBranches,
  // React Query hooks
  useBranches,
  useBranchHistory,
  useIsBranchSession,
  useRootSession,
  useCreateBranch,
  useDeleteBranch,
  useUpdateBranchName,
  useInvalidateBranchQueries,
  useMessageBranches,
  useBranchInfo,
  usePrefetchBranches,
  useConversationTree,
  useBranchCount,
  // Query keys for external use
  branchQueryKeys,
} from './use-conversation-branches';
export * from './use-search-history';
