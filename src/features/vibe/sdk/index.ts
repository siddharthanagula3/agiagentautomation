/**
 * VibeSDK - Cloudflare's Vibe AI SDK
 *
 * This is a copy of the VibeSDK from: https://github.com/nichochar/vibing-ai
 * Adapted for use in this project.
 *
 * The SDK provides:
 * - VibeClient: Main client for creating and managing AI-powered apps
 * - BuildSession: Session management with WebSocket communication
 * - WorkspaceStore: File storage and change tracking
 * - SessionStateStore: State management for generation, phases, deployment
 * - BlueprintStreamParser: Parser for streaming blueprint content
 *
 * Example usage:
 * ```typescript
 * import { VibeClient } from '@features/vibe/sdk';
 *
 * const client = new VibeClient({
 *   baseUrl: 'https://api.vibing.ai',
 *   token: 'your-jwt-token',
 * });
 *
 * const session = await client.build('Create a todo app');
 * session.on('file', (msg) => console.log('File:', msg.filePath));
 * await session.wait.generationComplete();
 * ```
 */

// Main exports
export { VibeClient } from './client';
export { BuildSession } from './session';
export { WorkspaceStore } from './workspace';
export { SessionStateStore } from './state';

// Blueprint utilities
export { isRecord, blueprintToMarkdown, BlueprintStreamParser } from './blueprint';
export type { Blueprint } from './blueprint';

// Utility exports
export { withTimeout, TimeoutError } from './utils';

// Retry utilities
export { normalizeRetryConfig, computeBackoffMs, sleep } from './retry';
export type { RetryConfig, NormalizedRetryConfig } from './retry';

// Emitter
export { TypedEmitter } from './emitter';

// NDJSON parser
export { parseNdjsonStream } from './ndjson';

// WebSocket connection
export { createAgentConnection } from './ws';

// HTTP client
export { HttpClient } from './http';

// Type exports
export type {
	AgentConnection,
	AgentConnectionOptions,
	AgentEventMap,
	AgentWebSocketMessage,
	AgentWsClientMessage,
	AgentWsServerMessage,
	ApiResponse,
	AppDetails,
	AppListItem,
	BehaviorType,
	BuildOptions,
	BuildStartEvent,
	CodeGenArgs,
	Credentials,
	FileTreeNode,
	PhaseEventType,
	ProjectType,
	PublicAppsQuery,
	SessionDeployable,
	SessionFiles,
	VibeClientOptions,
	WaitForPhaseOptions,
	WaitOptions,
	WebSocketLike,
	WsMessageOf,
} from './types';

// State types
export type {
	SessionState,
	ConnectionState,
	GenerationState,
	PhaseState,
	PreviewDeploymentState,
	CloudflareDeploymentState,
	ConversationState,
} from './state';

// Workspace types
export type { WorkspaceFile, WorkspaceChange } from './workspace';

// Protocol types (for advanced usage)
export type {
	AgentState,
	FileOutputType,
	WebSocketMessage,
	WebSocketMessageData,
	AgentConnectionData,
	AgentPreviewResponse,
	PlatformCodeGenArgs,
	TemplateDetails,
	AgentDisplayConfig,
	ModelConfigsInfo,
	ModelConfigsInfoMessage,
	CodeFixEdits,
	ConversationMessage,
} from './protocol';

// ============================================================================
// LOCAL INTEGRATION (for use without external Vibe API)
// ============================================================================

export {
	VibeSDKSession,
	useVibeSDKStore,
	type VibeSDKEvent,
} from './vibe-sdk-integration';
