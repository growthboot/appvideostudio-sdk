import { PlayerMessageClient } from './message-client.js';

const PLAYER_TAG_NAME = 'avs-player';
const DEFAULT_PLAYER_ORIGIN = 'https://create.appvideostudio.com';

export class AVSPlayerElement extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'autoplay', 'loop', 'no-controls'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.transport = null;
    this.iframe = null;
    this.ready = Promise.resolve();
  }

  connectedCallback() {
    if (this.transport) return;
    this.render();
    this.connectTransport();
  }

  disconnectedCallback() {
    this.destroyTransport();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name !== 'src' || oldValue === newValue || !this.isConnected) {
      return;
    }

    this.destroyTransport();
    this.render();
    this.connectTransport();
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

  getPlayerUrl() {
    const explicitSrc = this.getAttribute('src');
    const base = explicitSrc || `${DEFAULT_PLAYER_ORIGIN}/player/`;
    const url = new URL(base, typeof window !== 'undefined' ? window.location.href : DEFAULT_PLAYER_ORIGIN);

    if (this.hasAttribute('autoplay')) {
      url.searchParams.set('autoplay', '1');
    }
    if (this.hasAttribute('no-controls')) {
      url.searchParams.set('nocontrols', '1');
    }

    return url.toString();
  }

  connectTransport() {
    if (!this.iframe) return;

    const targetUrl = new URL(this.getPlayerUrl(), typeof window !== 'undefined' ? window.location.href : DEFAULT_PLAYER_ORIGIN);
    this.transport = new PlayerMessageClient({
      hostWindow: window,
      sourceOrigin: targetUrl.origin,
      getSourceWindow: () => this.iframe?.contentWindow,
      sendMessage: (message) => {
        this.iframe?.contentWindow?.postMessage(message, targetUrl.origin);
      },
    });

    this.transport.on('event', ({ event, payload }) => {
      this.dispatchEvent(new CustomEvent(event, {
        detail: payload,
      }));

      if (event === 'ended' && this.hasAttribute('loop')) {
        this.seek(0).then(() => this.play());
      }
    });

    this.ready = this.transport.ready.then((payload) => {
      this.dispatchEvent(new CustomEvent('ready', {
        detail: payload,
      }));
      return payload;
    });
  }

  destroyTransport() {
    this.transport?.destroy();
    this.transport = null;
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
  play() { return this.request('play'); }
  pause() { return this.request('pause'); }
  stop() { return this.request('stop'); }
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
