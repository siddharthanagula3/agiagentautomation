/**
 * VibeSDK Integration Service
 *
 * This service bridges the VibeSDK (Cloudflare's patterns) with the existing
 * Vibe infrastructure. It provides:
 *
 * 1. WorkspaceStore integration for generated files
 * 2. SessionStateStore for state tracking
 * 3. Event emitter for real-time updates
 * 4. Connection to existing services (message handler, file manager)
 *
 * Since our app uses its own backend (Netlify + Supabase) rather than
 * Cloudflare's Vibe API, we adapt the SDK's patterns locally.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { WorkspaceStore, type WorkspaceChange, type WorkspaceFile } from './workspace';
import { SessionStateStore, type SessionState, type ConnectionState, type GenerationState, type PhaseState } from './state';
import { TypedEmitter } from './emitter';
import { BlueprintStreamParser, type Blueprint } from './blueprint';
import type { FileTreeNode } from './types';

// ============================================================================
// SDK EVENT TYPES
// ============================================================================

export type VibeSDKEvent =
	// Connection events
	| { type: 'connected'; sessionId: string }
	| { type: 'disconnected' }
	| { type: 'error'; error: string }

	// Blueprint events
	| { type: 'blueprint_chunk'; chunk: string }
	| { type: 'blueprint_complete'; blueprint: Blueprint }

	// File events
	| { type: 'file_generating'; filePath: string }
	| { type: 'file_generated'; filePath: string; content: string }
	| { type: 'files_reset'; count: number }

	// Generation events
	| { type: 'generation_started'; totalFiles?: number }
	| { type: 'generation_progress'; filesGenerated: number; totalFiles?: number }
	| { type: 'generation_complete'; filesGenerated: number }
	| { type: 'generation_stopped' }

	// Phase events (phasic workflow)
	| { type: 'phase_changed'; phase: PhaseState }

	// Preview events
	| { type: 'preview_starting' }
	| { type: 'preview_ready'; url: string }
	| { type: 'preview_error'; error: string }

	// Deploy events
	| { type: 'deploy_started'; target: string }
	| { type: 'deploy_complete'; url: string }
	| { type: 'deploy_failed'; error: string };

type SDKEventMap = {
	event: VibeSDKEvent;
	state_change: { prev: SessionState; next: SessionState };
	workspace_change: WorkspaceChange;
};

// ============================================================================
// SDK SESSION CLASS
// ============================================================================

/**
 * VibeSDKSession - Local session that mirrors VibeSDK patterns
 *
 * Unlike the real VibeSDK which connects to Cloudflare's API via WebSocket,
 * this session works locally with the existing Vibe services.
 */
export class VibeSDKSession {
	readonly sessionId: string;
	readonly workspace = new WorkspaceStore();
	readonly state = new SessionStateStore();
	readonly blueprintParser = new BlueprintStreamParser();

	private emitter = new TypedEmitter<SDKEventMap>();
	private _isConnected = false;

	constructor(sessionId: string) {
		this.sessionId = sessionId;

		// Wire up state changes to emit events
		this.state.onChange((next, prev) => {
			this.emitter.emit('state_change', { prev, next });

			// Emit specific events based on state changes
			if (prev.generation.status !== next.generation.status) {
				this.emitGenerationEvent(prev.generation, next.generation);
			}
			if (prev.phase.status !== next.phase.status) {
				this.emitter.emit('event', { type: 'phase_changed', phase: next.phase });
			}
		});

		// Wire up workspace changes
		this.workspace.onChange((change) => {
			this.emitter.emit('workspace_change', change);

			if (change.type === 'upsert') {
				const content = this.workspace.read(change.path);
				this.emitter.emit('event', {
					type: 'file_generated',
					filePath: change.path,
					content: content || '',
				});
			} else if (change.type === 'reset') {
				this.emitter.emit('event', { type: 'files_reset', count: change.files });
			}
		});
	}

	private emitGenerationEvent(prev: GenerationState, next: GenerationState): void {
		if (next.status === 'running' && prev.status !== 'running') {
			const totalFiles = 'totalFiles' in next ? next.totalFiles : undefined;
			this.emitter.emit('event', { type: 'generation_started', totalFiles });
		} else if (next.status === 'complete') {
			const filesGenerated = 'filesGenerated' in next ? next.filesGenerated : 0;
			this.emitter.emit('event', { type: 'generation_complete', filesGenerated });
		} else if (next.status === 'stopped') {
			this.emitter.emit('event', { type: 'generation_stopped' });
		}
	}

	// =========================================================================
	// CONNECTION MANAGEMENT
	// =========================================================================

	connect(): void {
		this._isConnected = true;
		this.state.setConnection('connected');
		this.emitter.emit('event', { type: 'connected', sessionId: this.sessionId });
	}

	disconnect(): void {
		this._isConnected = false;
		this.state.setConnection('disconnected');
		this.emitter.emit('event', { type: 'disconnected' });
	}

	get isConnected(): boolean {
		return this._isConnected;
	}

	// =========================================================================
	// GENERATION CONTROL
	// =========================================================================

	startGeneration(totalFiles?: number): void {
		// Simulate generation_started message
		this.state.applyWsMessage({
			type: 'generation_started',
			totalFiles,
		});
	}

	completeGeneration(previewURL?: string): void {
		this.state.applyWsMessage({
			type: 'generation_complete',
			instanceId: this.sessionId,
			previewURL,
		});
	}

	stopGeneration(): void {
		this.state.applyWsMessage({
			type: 'generation_stopped',
			instanceId: this.sessionId,
		});
	}

	// =========================================================================
	// FILE MANAGEMENT
	// =========================================================================

	/**
	 * Write a file to the workspace
	 */
	writeFile(path: string, content: string): void {
		// Emit file_generating first
		this.state.applyWsMessage({
			type: 'file_generating',
			filePath: path,
		});

		// Then emit file_generated with content
		this.state.applyWsMessage({
			type: 'file_generated',
			file: { filePath: path, fileContents: content },
			filePath: path,
		});

		// Apply to workspace
		this.workspace.applyFileUpsert({ filePath: path, fileContents: content });
	}

	/**
	 * Write multiple files
	 */
	writeFiles(files: Array<{ path: string; content: string }>): void {
		for (const file of files) {
			this.writeFile(file.path, file.content);
		}
	}

	/**
	 * Read a file from workspace
	 */
	readFile(path: string): string | null {
		return this.workspace.read(path);
	}

	/**
	 * Get all file paths
	 */
	listFiles(): string[] {
		return this.workspace.paths();
	}

	/**
	 * Get file tree structure
	 */
	getFileTree(): FileTreeNode[] {
		return buildFileTree(this.workspace.paths());
	}

	/**
	 * Get all files as a snapshot
	 */
	getFilesSnapshot(): Record<string, string> {
		return this.workspace.snapshot();
	}

	// =========================================================================
	// BLUEPRINT HANDLING
	// =========================================================================

	appendBlueprintChunk(chunk: string): string {
		const markdown = this.blueprintParser.append(chunk);
		this.emitter.emit('event', { type: 'blueprint_chunk', chunk });
		return markdown;
	}

	getBlueprintMarkdown(): string {
		return this.blueprintParser.toMarkdown();
	}

	clearBlueprint(): void {
		this.blueprintParser.clear();
	}

	// =========================================================================
	// PHASE MANAGEMENT
	// =========================================================================

	setPhase(status: PhaseState['status'], name?: string, description?: string): void {
		const phaseMap: Record<string, string> = {
			generating: 'phase_generating',
			generated: 'phase_generated',
			implementing: 'phase_implementing',
			implemented: 'phase_implemented',
			validating: 'phase_validating',
			validated: 'phase_validated',
		};

		const messageType = phaseMap[status];
		if (messageType && status !== 'idle') {
			this.state.applyWsMessage({
				type: messageType as 'phase_generating',
				phase: { name, description },
			});
		}
	}

	// =========================================================================
	// PREVIEW MANAGEMENT
	// =========================================================================

	startPreview(): void {
		this.state.applyWsMessage({ type: 'deployment_started' });
		this.emitter.emit('event', { type: 'preview_starting' });
	}

	completePreview(previewURL: string, tunnelURL?: string): void {
		this.state.applyWsMessage({
			type: 'deployment_completed',
			previewURL,
			tunnelURL: tunnelURL || previewURL,
			instanceId: this.sessionId,
		});
		this.emitter.emit('event', { type: 'preview_ready', url: previewURL });
	}

	failPreview(error: string): void {
		this.state.applyWsMessage({
			type: 'deployment_failed',
			error,
		});
		this.emitter.emit('event', { type: 'preview_error', error });
	}

	// =========================================================================
	// EVENT SUBSCRIPTIONS
	// =========================================================================

	onEvent(handler: (event: VibeSDKEvent) => void): () => void {
		return this.emitter.on('event', handler);
	}

	onStateChange(handler: (next: SessionState, prev: SessionState) => void): () => void {
		return this.emitter.on('state_change', ({ next, prev }) => handler(next, prev));
	}

	onWorkspaceChange(handler: (change: WorkspaceChange) => void): () => void {
		return this.emitter.on('workspace_change', handler);
	}

	// =========================================================================
	// STATE GETTERS
	// =========================================================================

	getState(): SessionState {
		return this.state.get();
	}

	getConnectionState(): ConnectionState {
		return this.state.get().connection;
	}

	getGenerationState(): GenerationState {
		return this.state.get().generation;
	}

	getPhaseState(): PhaseState {
		return this.state.get().phase;
	}

	getPreviewUrl(): string | undefined {
		return this.state.get().previewUrl;
	}

	// =========================================================================
	// CLEANUP
	// =========================================================================

	clear(): void {
		this.workspace.clear();
		this.state.clear();
		this.blueprintParser.clear();
		this.emitter.clear();
	}
}

// ============================================================================
// FILE TREE BUILDER (from session.ts)
// ============================================================================

function buildFileTree(paths: string[]): FileTreeNode[] {
	type Dir = {
		name: string;
		path: string;
		dirs: Map<string, Dir>;
		files: FileTreeNode[];
	};

	const root: Dir = { name: '', path: '', dirs: new Map(), files: [] };

	for (const p of paths) {
		const parts = p.split('/').filter(Boolean);
		let curr = root;
		for (let i = 0; i < parts.length; i += 1) {
			const part = parts[i]!;
			const isLast = i === parts.length - 1;
			if (isLast) {
				curr.files.push({ type: 'file', name: part, path: p });
				continue;
			}

			const nextPath = curr.path ? `${curr.path}/${part}` : part;
			let next = curr.dirs.get(part);
			if (!next) {
				next = { name: part, path: nextPath, dirs: new Map(), files: [] };
				curr.dirs.set(part, next);
			}
			curr = next;
		}
	}

	function toNodes(dir: Dir): FileTreeNode[] {
		const dirs = Array.from(dir.dirs.values())
			.sort((a, b) => a.name.localeCompare(b.name))
			.map(
				(d) =>
					({
						type: 'dir',
						name: d.name,
						path: d.path,
						children: toNodes(d),
					}) as FileTreeNode,
			);
		const files = dir.files.sort((a, b) => a.name.localeCompare(b.name));
		return [...dirs, ...files];
	}

	return toNodes(root);
}

// ============================================================================
// ZUSTAND STORE FOR GLOBAL SDK STATE
// ============================================================================

interface VibeSDKStoreState {
	// Active session
	session: VibeSDKSession | null;
	sessionId: string | null;

	// Cached state for React reactivity
	connectionState: ConnectionState;
	generationState: GenerationState;
	phaseState: PhaseState;
	files: WorkspaceFile[];
	fileTree: FileTreeNode[];
	previewUrl: string | null;
	lastError: string | null;

	// Actions
	createSession: (sessionId: string) => VibeSDKSession;
	getSession: () => VibeSDKSession | null;
	clearSession: () => void;

	// File actions (convenience wrappers)
	writeFile: (path: string, content: string) => void;
	writeFiles: (files: Array<{ path: string; content: string }>) => void;
	readFile: (path: string) => string | null;

	// Generation actions
	startGeneration: (totalFiles?: number) => void;
	completeGeneration: () => void;

	// Internal state sync
	_syncState: () => void;
}

export const useVibeSDKStore = create<VibeSDKStoreState>()(
	devtools(
		immer((set, get) => ({
			// Initial state
			session: null,
			sessionId: null,
			connectionState: 'disconnected',
			generationState: { status: 'idle' },
			phaseState: { status: 'idle' },
			files: [],
			fileTree: [],
			previewUrl: null,
			lastError: null,

			createSession: (sessionId: string) => {
				// Clear existing session
				const existing = get().session;
				if (existing) {
					existing.clear();
				}

				// Create new session
				const session = new VibeSDKSession(sessionId);

				// Subscribe to state changes for React reactivity
				session.onStateChange(() => {
					get()._syncState();
				});

				session.onWorkspaceChange(() => {
					get()._syncState();
				});

				// Connect the session
				session.connect();

				set((state) => {
					state.session = session as unknown as VibeSDKSession;
					state.sessionId = sessionId;
				});

				get()._syncState();

				return session;
			},

			getSession: () => {
				return get().session;
			},

			clearSession: () => {
				const session = get().session;
				if (session) {
					session.disconnect();
					session.clear();
				}

				set((state) => {
					state.session = null;
					state.sessionId = null;
					state.connectionState = 'disconnected';
					state.generationState = { status: 'idle' };
					state.phaseState = { status: 'idle' };
					state.files = [];
					state.fileTree = [];
					state.previewUrl = null;
					state.lastError = null;
				});
			},

			writeFile: (path: string, content: string) => {
				const session = get().session;
				if (session) {
					session.writeFile(path, content);
				}
			},

			writeFiles: (files: Array<{ path: string; content: string }>) => {
				const session = get().session;
				if (session) {
					session.writeFiles(files);
				}
			},

			readFile: (path: string) => {
				const session = get().session;
				return session?.readFile(path) ?? null;
			},

			startGeneration: (totalFiles?: number) => {
				const session = get().session;
				if (session) {
					session.startGeneration(totalFiles);
				}
			},

			completeGeneration: () => {
				const session = get().session;
				if (session) {
					session.completeGeneration();
				}
			},

			_syncState: () => {
				const session = get().session;
				if (!session) return;

				const sessionState = session.getState();
				const paths = session.listFiles();
				const snapshot = session.getFilesSnapshot();

				set((state) => {
					state.connectionState = sessionState.connection;
					state.generationState = sessionState.generation;
					state.phaseState = sessionState.phase;
					state.previewUrl = sessionState.previewUrl ?? null;
					state.lastError = sessionState.lastError ?? null;

					// Convert snapshot to file array
					state.files = paths.map((path) => ({
						path,
						content: snapshot[path] || '',
					}));

					// Update file tree
					state.fileTree = session.getFileTree();
				});
			},
		})),
		{ name: 'VibeSDKStore' }
	)
);

// ============================================================================
// EXPORTS
// ============================================================================

export { WorkspaceStore, SessionStateStore, TypedEmitter, BlueprintStreamParser };
export type {
	WorkspaceChange,
	WorkspaceFile,
	SessionState,
	ConnectionState,
	GenerationState,
	PhaseState,
	Blueprint,
	FileTreeNode,
};
