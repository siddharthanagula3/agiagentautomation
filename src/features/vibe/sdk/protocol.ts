/**
 * Protocol types for VibeSDK
 *
 * These types are adapted from the VibeSDK worker types.
 * Original source: https://github.com/nichochar/vibing-ai
 *
 * Since we don't have access to the worker directory, we define the
 * necessary types locally based on the SDK's usage patterns.
 */

// ============================================================================
// BEHAVIOR AND PROJECT TYPES
// ============================================================================

export type BehaviorType = 'agentic' | 'phasic';
export type ProjectType = 'react' | 'nextjs' | 'vue' | 'svelte' | 'vanilla' | string;

// ============================================================================
// FILE OUTPUT TYPE
// ============================================================================

export type FileOutputType = {
	filePath: string;
	fileContents: string;
	language?: string;
};

// ============================================================================
// AGENT STATE
// ============================================================================

export type AgentState = {
	behaviorType?: BehaviorType;
	projectType?: ProjectType;
	generatedFilesMap?: Record<string, FileOutputType>;
	currentPhase?: string;
	status?: string;
	previewUrl?: string;
	instanceId?: string;
};

// ============================================================================
// TEMPLATE DETAILS
// ============================================================================

export type TemplateDetails = {
	name: string;
	files?: Record<string, string>;
	description?: string;
};

// ============================================================================
// CODEGEN ARGS
// ============================================================================

export type PlatformCodeGenArgs = {
	query: string;
	language?: string;
	frameworks?: string[];
	selectedTemplate?: string;
	behaviorType?: BehaviorType;
	projectType?: ProjectType;
	images?: unknown[];
	credentials?: {
		openaiApiKey?: string;
		anthropicApiKey?: string;
		[key: string]: string | undefined;
	};
};

// ============================================================================
// WEBSOCKET MESSAGE TYPES
// ============================================================================

export type WebSocketMessageData = Record<string, unknown>;

export type WebSocketMessage =
	// Connection events
	| { type: 'agent_connected'; state: AgentState; previewUrl?: string }
	| { type: 'cf_agent_state'; state: AgentState }

	// Generation events
	| { type: 'generation_started'; totalFiles?: number; instanceId?: string }
	| { type: 'generation_complete'; instanceId?: string; previewURL?: string }
	| { type: 'generation_stopped'; instanceId?: string }
	| { type: 'generation_resumed'; instanceId?: string }

	// File events
	| { type: 'file_generating'; filePath: string }
	| { type: 'file_generated'; file: FileOutputType; filePath?: string }
	| { type: 'file_chunk_generated'; filePath: string; chunk: string }
	| { type: 'file_regenerating'; filePath: string }
	| { type: 'file_regenerated'; file: FileOutputType; filePath?: string }

	// Phase events (phasic behavior)
	| { type: 'phase_generating'; phase?: { name?: string; description?: string } }
	| { type: 'phase_generated'; phase?: { name?: string; description?: string } }
	| { type: 'phase_implementing'; phase?: { name?: string; description?: string } }
	| { type: 'phase_implemented'; phase?: { name?: string; description?: string } }
	| { type: 'phase_validating'; phase?: { name?: string; description?: string } }
	| { type: 'phase_validated'; phase?: { name?: string; description?: string } }

	// Preview deployment events
	| { type: 'deployment_started' }
	| { type: 'deployment_completed'; previewURL: string; tunnelURL: string; instanceId: string }
	| { type: 'deployment_failed'; error: string }

	// Cloudflare deployment events
	| { type: 'cloudflare_deployment_started'; instanceId?: string }
	| { type: 'cloudflare_deployment_completed'; deploymentUrl: string; instanceId: string; workersUrl?: string }
	| { type: 'cloudflare_deployment_error'; error: string; instanceId?: string }

	// Conversation events
	| { type: 'conversation_state'; state: ConversationState }
	| { type: 'conversation_response'; response: string; suggestions?: string[] }

	// Error events
	| { type: 'error'; error: string; code?: string }

	// Heartbeat
	| { type: 'heartbeat' };

// ============================================================================
// CONVERSATION STATE
// ============================================================================

export type ConversationMessage = {
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp?: string;
};

export type ConversationState = {
	messages: ConversationMessage[];
	suggestions?: string[];
};

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export type AgentConnectionData = {
	agentId: string;
	websocketUrl: string;
	httpStatusUrl?: string;
};

export type AgentPreviewResponse = {
	previewUrl: string;
	tunnelUrl?: string;
	instanceId?: string;
};

// ============================================================================
// MODEL CONFIG TYPES
// ============================================================================

export type AgentDisplayConfig = {
	name?: string;
	description?: string;
	icon?: string;
};

export type ModelConfigsInfo = {
	availableModels?: string[];
	defaultModel?: string;
};

export type ModelConfigsInfoMessage = {
	type: 'model_configs';
	configs: ModelConfigsInfo;
};

export type CodeFixEdits = {
	filePath: string;
	edits: Array<{
		range: { start: number; end: number };
		newText: string;
	}>;
};
