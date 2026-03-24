export const AVS_READY_MESSAGE = 'avs:ready';
export const AVS_REQUEST_MESSAGE = 'avs:request';
export const AVS_RESPONSE_MESSAGE = 'avs:response';
export const AVS_EVENT_MESSAGE = 'avs:event';

export function createRequestId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `avs-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function serializeError(error, fallbackMessage = 'Unknown player error') {
  if (!error) {
    return {
      code: 'unknown_error',
      message: fallbackMessage,
    };
  }

  if (typeof error === 'object') {
    return {
      code: typeof error.code === 'string' ? error.code : 'player_error',
      message: typeof error.message === 'string' ? error.message : fallbackMessage,
      ...error,
    };
  }

  return {
    code: 'player_error',
    message: String(error),
  };
}
