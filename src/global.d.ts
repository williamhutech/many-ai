interface Window {
  amplitude: {
    init: (apiKey: string, userId?: string | null, options?: any) => void;
    track: (eventName: string, eventProperties?: Record<string, any>) => void;
  };
}

declare module '@amplitude/analytics-browser' {
  export function init(apiKey: string, userId?: string | null, options?: any): void;
  export function track(eventName: string, eventProperties?: Record<string, any>): void;
  export function add(plugin: any): void;
}

declare module '@amplitude/plugin-session-replay-browser' {
  export function sessionReplayPlugin(options?: any): any;
}
