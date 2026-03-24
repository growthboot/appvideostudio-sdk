export interface PlayerMessageClientOptions {
  hostWindow?: Window;
  sourceOrigin: string;
  getSourceWindow?: () => Window | null;
  sendMessage: (message: unknown) => void;
  timeoutMs?: number;
}

export interface RequestOptions {
  timeoutMs?: number;
}

export declare class PlayerMessageClient {
  readonly ready: Promise<unknown>;

  constructor(options: PlayerMessageClientOptions);
  on(eventName: string, handler: (detail: unknown) => void): () => void;
  off(eventName: string, handler: (detail: unknown) => void): void;
  request(method: string, args?: unknown[], options?: RequestOptions): Promise<unknown>;
  destroy(): void;
}
