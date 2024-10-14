interface Window {
  amplitude: {
    init: (apiKey: string, userId?: string | null, options?: Record<string, unknown>) => void;
    track: (eventName: string, eventProperties?: Record<string, unknown>) => void;
  };
}

declare module '@amplitude/analytics-browser' {
  export function init(apiKey: string, userId?: string | null, options?: Record<string, unknown>): void;
  export function track(eventName: string, eventProperties?: Record<string, unknown>): void;
  export function add(plugin: unknown): void;
}

declare module '@amplitude/plugin-session-replay-browser' {
  export function sessionReplayPlugin(options?: Record<string, unknown>): unknown;
}
