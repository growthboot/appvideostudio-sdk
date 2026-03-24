export declare const AVS_READY_MESSAGE: 'avs:ready';
export declare const AVS_REQUEST_MESSAGE: 'avs:request';
export declare const AVS_RESPONSE_MESSAGE: 'avs:response';
export declare const AVS_EVENT_MESSAGE: 'avs:event';

export interface PlayerError {
  code: string;
  message: string;
  [key: string]: unknown;
}

export declare function createRequestId(): string;
export declare function serializeError(error: unknown, fallbackMessage?: string): PlayerError;
