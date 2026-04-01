import { PlayerMessageClient } from './message-client.js';

const PLAYER_TAG_NAME = 'avs-player';

export class AVSPlayerElement extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'autoplay', 'loop', 'no-controls', 'defer', 'auto-pause'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.transport = null;
    this.iframe = null;
    this.ready = null;
    this.resolveReady = null;
    this.rejectReady = null;
    this.visibilityObserver = null;
    this.hasEnteredViewport = false;
    this.isInViewport = false;
    this.isPlaybackActive = false;

    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.resetReadyPromise();
  }

  connectedCallback() {
    this.syncVisibilityObserver();

    if (this.transport) return;

    if (this.iframe) {
      this.connectTransport();
      return;
    }

    if (this.shouldDeferIframeLoad()) {
      this.renderDeferredPlaceholder();
      return;
    }

    this.render();
    this.connectTransport();
  }

  disconnectedCallback() {
    this.destroyTransport();
    this.destroyVisibilityObserver();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.isConnected) {
      return;
    }

    if (name === 'src') {
      this.resetReadyPromise();
      this.hasEnteredViewport = !this.hasAttribute('defer') || this.isInViewport || !this.supportsViewportObserver();
      this.destroyTransport();
      this.iframe = null;

      if (this.shouldDeferIframeLoad()) {
        this.renderDeferredPlaceholder();
      } else {
        this.render();
        this.connectTransport();
      }

      this.syncVisibilityObserver();
      return;
    }

    if (name === 'defer' || name === 'auto-pause') {
      this.syncVisibilityObserver();
      if (!this.iframe && !this.shouldDeferIframeLoad()) {
        this.render();
        this.connectTransport();
        return;
      }

      if (!this.iframe && this.shouldDeferIframeLoad()) {
        this.renderDeferredPlaceholder();
      }
    }
  }

  render() {
    const iframeSrc = this.getPlayerUrl();
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          min-height: 320px;
        }

        iframe {
          display: block;
          width: 100%;
          height: 100%;
          min-height: inherit;
          border: 0;
          background: #0d1117;
        }
      </style>
      <iframe
        allow="autoplay; fullscreen"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
        src="${iframeSrc}"
        title="AppVideoStudio Player"
      ></iframe>
    `;

    this.iframe = this.shadowRoot.querySelector('iframe');
  }

  renderDeferredPlaceholder() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          min-height: 320px;
        }

        .player-placeholder {
          display: block;
          width: 100%;
          min-height: inherit;
          background: #0d1117;
        }
      </style>
      <div class="player-placeholder" part="placeholder" aria-hidden="true"></div>
    `;

    this.iframe = null;
  }

  resetReadyPromise() {
    this.ready = new Promise((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });
  }

  getPlayerUrl() {
    const explicitSrc = this.getAttribute('src');
    const base = explicitSrc || `${new URL(import.meta.url).origin}/player/`;
    const url = new URL(base, window.location.href);

    if (this.hasAttribute('autoplay')) {
      url.searchParams.set('autoplay', '1');
    }
    if (this.hasAttribute('no-controls')) {
      url.searchParams.set('nocontrols', '1');
    }

    return url.toString();
  }

  supportsViewportObserver() {
    return typeof IntersectionObserver === 'function';
  }

  shouldDeferIframeLoad() {
    return this.hasAttribute('defer')
      && !this.iframe
      && !this.hasEnteredViewport
      && this.supportsViewportObserver();
  }

  syncVisibilityObserver() {
    if (!this.supportsViewportObserver()) {
      this.destroyVisibilityObserver();
      return;
    }

    const needsObserver = this.hasAttribute('defer') || this.hasAttribute('auto-pause');
    if (!needsObserver) {
      this.destroyVisibilityObserver();
      return;
    }

    if (!this.visibilityObserver) {
      this.visibilityObserver = new IntersectionObserver(this.handleVisibilityChange, {
        threshold: 0,
      });
    } else {
      this.visibilityObserver.disconnect();
    }

    this.visibilityObserver.observe(this);
  }

  destroyVisibilityObserver() {
    this.visibilityObserver?.disconnect();
    this.visibilityObserver = null;
    this.isInViewport = false;
  }

  handleVisibilityChange(entries) {
    const entry = entries.find((candidate) => candidate.target === this) || entries[0];
    const nextIsInViewport = Boolean(entry?.isIntersecting || entry?.intersectionRatio > 0);
    const wasInViewport = this.isInViewport;

    this.isInViewport = nextIsInViewport;

    if (nextIsInViewport) {
      this.hasEnteredViewport = true;
      if (!this.iframe) {
        this.render();
        this.connectTransport();
      }
      return;
    }

    if (wasInViewport && this.hasAttribute('auto-pause') && this.isPlaybackActive) {
      this.pause().catch(() => {});
    }
  }

  connectTransport() {
    if (!this.iframe || this.transport) return;

    const targetUrl = new URL(this.getPlayerUrl(), window.location.href);
    this.transport = new PlayerMessageClient({
      hostWindow: window,
      sourceOrigin: targetUrl.origin,
      getSourceWindow: () => this.iframe?.contentWindow,
      sendMessage: (message) => {
        this.iframe?.contentWindow?.postMessage(message, targetUrl.origin);
      },
    });

    this.transport.on('event', ({ event, payload }) => {
      if (event === 'play') {
        this.isPlaybackActive = true;
      }
      if (event === 'pause' || event === 'ended' || event === 'stop') {
        this.isPlaybackActive = false;
      }

      this.dispatchEvent(new CustomEvent(event, {
        detail: payload,
      }));

      if (event === 'ended' && this.hasAttribute('loop')) {
        this.seek(0).then(() => this.play());
      }
    });

    this.transport.ready.then((payload) => {
      this.resolveReady?.(payload);
      this.dispatchEvent(new CustomEvent('ready', {
        detail: payload,
      }));
      return payload;
    }).catch((error) => {
      this.rejectReady?.(error);
    });
  }

  destroyTransport() {
    this.transport?.destroy();
    this.transport = null;
    this.isPlaybackActive = false;
  }

  on(eventName, handler) {
    this.addEventListener(eventName, handler);
    return () => this.removeEventListener(eventName, handler);
  }

  off(eventName, handler) {
    this.removeEventListener(eventName, handler);
  }

  request(method, ...args) {
    if (!this.transport) {
      return Promise.reject(new Error('Player iframe is not connected.'));
    }
    return this.transport.request(method, args);
  }

  load(document) {
    const result = this.request('load', document);
    if (this.hasAttribute('autoplay')) {
      return result.then((value) => this.play().then(() => value));
    }
    return result;
  }
  loadFromUrl(url) {
    const result = this.request('loadFromUrl', url);
    if (this.hasAttribute('autoplay')) {
      return result.then((value) => this.play().then(() => value));
    }
    return result;
  }
  preloadAssets() { return this.request('preloadAssets'); }
  play() {
    return this.request('play').then((value) => {
      this.isPlaybackActive = true;
      return value;
    });
  }
  pause() {
    return this.request('pause').then((value) => {
      this.isPlaybackActive = false;
      return value;
    });
  }
  stop() {
    return this.request('stop').then((value) => {
      this.isPlaybackActive = false;
      return value;
    });
  }
  seek(time) { return this.request('seek', time); }
  destroy() {
    const destroyPromise = this.transport ? this.request('destroy').catch(() => null) : Promise.resolve();
    this.destroyTransport();
    return destroyPromise;
  }
  createEmptyProject(options) { return this.request('createEmptyProject', options); }
  getDocument() { return this.request('getDocument'); }
  exportDocument() { return this.request('exportDocument'); }
  replaceDocument(document) { return this.request('replaceDocument', document); }
  validateDocument(document) { return this.request('validateDocument', document); }
  getStatus() { return this.request('getStatus'); }
  getErrors() { return this.request('getErrors'); }
  getAssets() { return this.request('getAssets'); }
  getAsset(assetId) { return this.request('getAsset', assetId); }
  addAsset(asset) { return this.request('addAsset', asset); }
  updateAsset(assetId, patch) { return this.request('updateAsset', assetId, patch); }
  removeAsset(assetId) { return this.request('removeAsset', assetId); }
  getTimeline(range) { return this.request('getTimeline', range || {}); }
  getComponent(componentId) { return this.request('getComponent', componentId); }
  addComponent(definition) { return this.request('addComponent', definition); }
  updateComponent(componentId, patch) { return this.request('updateComponent', componentId, patch); }
  updateComponentParams(componentId, patch) { return this.request('updateComponentParams', componentId, patch); }
  updateComponentTiming(componentId, patch) { return this.request('updateComponentTiming', componentId, patch); }
  updateComponentAssets(componentId, patch) { return this.request('updateComponentAssets', componentId, patch); }
  updateComponentMetadata(componentId, patch) { return this.request('updateComponentMetadata', componentId, patch); }
  moveComponent(componentId, patch) { return this.request('moveComponent', componentId, patch); }
  moveComponents(moves) { return this.request('moveComponents', moves); }
  removeComponent(componentId) { return this.request('removeComponent', componentId); }
  clearTimeline() { return this.request('clearTimeline'); }
  getLayers() { return this.request('getLayers'); }
  addLayer(patch) { return this.request('addLayer', patch || {}); }
  updateLayer(layerId, patch) { return this.request('updateLayer', layerId, patch); }
  removeLayer(layerId) { return this.request('removeLayer', layerId); }
  reorderLayers(layerIds) { return this.request('reorderLayers', layerIds); }
  listTemplates() { return this.request('listTemplates'); }
  getTemplate(templateId) { return this.request('getTemplate', templateId); }
  getComponentPanel(componentId) { return this.request('getComponentPanel', componentId); }
}

export function defineAVSPlayerElement() {
  if (!customElements.get(PLAYER_TAG_NAME)) {
    customElements.define(PLAYER_TAG_NAME, AVSPlayerElement);
  }
  return customElements.get(PLAYER_TAG_NAME);
}
