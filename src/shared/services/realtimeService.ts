// Lightweight realtime service stub to prevent lazy import failures.
// This can be replaced with an actual implementation (e.g., Supabase Realtime or WebSocket hub)

type Unsubscribe = () => void;

export interface RealtimeService {
  connect: () => void;
  disconnect: () => void;
  subscribe: (
    channel: string,
    handler: (...args: unknown[]) => void
  ) => Unsubscribe;
  publish: (channel: string, payload: unknown) => void;
}

export const realtimeService: RealtimeService = {
  connect: () => {
    // no-op
  },
  disconnect: () => {
    // no-op
  },
  subscribe: (_channel, _handler) => {
    // return unsubscribe no-op
    return () => {};
  },
  publish: (_channel, _payload) => {
    // no-op
  },
};
