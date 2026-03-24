import {
  AVS_EVENT_MESSAGE,
  AVS_READY_MESSAGE,
  AVS_REQUEST_MESSAGE,
  AVS_RESPONSE_MESSAGE,
  createRequestId,
  serializeError,
} from './protocol.js';

export class PlayerMessageClient {
  constructor({
    hostWindow = window,
    sourceOrigin,
    getSourceWindow,
    sendMessage,
    timeoutMs = 10000,
  } = {}) {
    this.hostWindow = hostWindow;
    this.sourceOrigin = sourceOrigin;
    this.getSourceWindow = getSourceWindow;
    this.sendMessage = sendMessage;
    this.timeoutMs = timeoutMs;
    this.pending = new Map();
    this.listeners = new Map();
    this.readyResolved = false;
    this.destroyed = false;

    this.ready = new Promise((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });

    this.handleMessage = this.handleMessage.bind(this);
    this.hostWindow.addEventListener('message', this.handleMessage);
  }

  isValidMessage(event) {
    if (this.destroyed) return false;
    if (event.origin !== this.sourceOrigin) return false;
    if (typeof this.getSourceWindow === 'function' && event.source !== this.getSourceWindow()) {
      return false;
    }
    return true;
  }

  emit(eventName, detail) {
    const handlers = this.listeners.get(eventName);
    if (!handlers) return;
    for (const handler of handlers) {
      handler(detail);
    }
  }

  handleMessage(event) {
    if (!this.isValidMessage(event)) return;

    const data = event.data || {};
    if (data.type === AVS_READY_MESSAGE) {
      this.readyResolved = true;
      this.resolveReady?.(data.payload || null);
      this.emit(AVS_READY_MESSAGE, data.payload || null);
      return;
    }

    if (data.type === AVS_EVENT_MESSAGE) {
      this.emit('event', data);
      this.emit(data.event, data.payload);
      return;
    }

    if (data.type !== AVS_RESPONSE_MESSAGE || !data.requestId) {
      return;
    }

    const pending = this.pending.get(data.requestId);
    if (!pending) return;

    this.pending.delete(data.requestId);
    clearTimeout(pending.timerId);

    if (data.ok) {
      pending.resolve(data.result);
      return;
    }

    pending.reject(serializeError(data.error, 'Player request failed'));
  }

  on(eventName, handler) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(handler);
    return () => this.off(eventName, handler);
  }

  off(eventName, handler) {
    this.listeners.get(eventName)?.delete(handler);
  }

  async request(method, args = [], options = {}) {
    if (this.destroyed) {
      throw serializeError({ code: 'destroyed', message: 'Player transport has been destroyed.' });
    }

    await this.ready;

    const requestId = createRequestId();
    const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : this.timeoutMs;

    return new Promise((resolve, reject) => {
      const timerId = setTimeout(() => {
        this.pending.delete(requestId);
        reject(serializeError({
          code: 'timeout',
          message: `Player request timed out for "${method}".`,
          method,
        }));
      }, timeoutMs);

      this.pending.set(requestId, {
        resolve,
        reject,
        timerId,
      });

      this.sendMessage({
        type: AVS_REQUEST_MESSAGE,
        requestId,
        method,
        args,
      });
    });
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.hostWindow.removeEventListener('message', this.handleMessage);

    for (const [requestId, pending] of this.pending.entries()) {
      clearTimeout(pending.timerId);
      pending.reject(serializeError({
        code: 'destroyed',
        message: `Player transport was destroyed before "${requestId}" completed.`,
      }));
    }
    this.pending.clear();

    if (!this.readyResolved) {
      this.rejectReady?.(serializeError({
        code: 'destroyed',
        message: 'Player transport was destroyed before the iframe became ready.',
      }));
    }

    this.listeners.clear();
  }
}
