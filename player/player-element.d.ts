import type { VideoDocument, AssetDefinition, TimelineComponent, LayerDefinition, ValidationError } from '../document/document.js';

export interface PlayerStatus {
  state: string;
  currentTime: number;
  duration: number;
  [key: string]: unknown;
}

export interface TemplateSummary {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface ComponentPanel {
  [key: string]: unknown;
}

export declare class AVSPlayerElement extends HTMLElement {
  static readonly observedAttributes: string[];

  readonly ready: Promise<unknown>;

  on(eventName: string, handler: (event: Event) => void): () => void;
  off(eventName: string, handler: (event: Event) => void): void;
  request(method: string, ...args: unknown[]): Promise<unknown>;

  load(document: VideoDocument): Promise<void>;
  loadFromUrl(url: string): Promise<void>;
  preloadAssets(): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seek(time: number): Promise<void>;
  destroy(): Promise<void>;

  createEmptyProject(options?: Record<string, unknown>): Promise<VideoDocument>;
  getDocument(): Promise<VideoDocument>;
  exportDocument(): Promise<VideoDocument>;
  replaceDocument(document: VideoDocument): Promise<void>;
  validateDocument(document: VideoDocument): Promise<ValidationError[]>;

  getStatus(): Promise<PlayerStatus>;
  getErrors(): Promise<Array<{ code: string; message: string }>>;

  getAssets(): Promise<AssetDefinition[]>;
  getAsset(assetId: string): Promise<AssetDefinition>;
  addAsset(asset: Partial<AssetDefinition>): Promise<AssetDefinition>;
  updateAsset(assetId: string, patch: Partial<AssetDefinition>): Promise<void>;
  removeAsset(assetId: string): Promise<void>;

  getTimeline(range?: { startTime?: number; endTime?: number }): Promise<TimelineComponent[]>;
  getComponent(componentId: string): Promise<TimelineComponent>;
  addComponent(definition: Partial<TimelineComponent>): Promise<TimelineComponent>;
  updateComponent(componentId: string, patch: Partial<TimelineComponent>): Promise<void>;
  updateComponentParams(componentId: string, patch: Record<string, unknown>): Promise<void>;
  updateComponentTiming(componentId: string, patch: { startTime?: number; duration?: number }): Promise<void>;
  updateComponentAssets(componentId: string, patch: Record<string, string>): Promise<void>;
  updateComponentMetadata(componentId: string, patch: Record<string, unknown>): Promise<void>;
  moveComponent(componentId: string, patch: Record<string, unknown>): Promise<void>;
  moveComponents(moves: Array<Record<string, unknown>>): Promise<void>;
  removeComponent(componentId: string): Promise<void>;
  clearTimeline(): Promise<void>;

  getLayers(): Promise<LayerDefinition[]>;
  addLayer(patch?: Partial<LayerDefinition>): Promise<LayerDefinition>;
  updateLayer(layerId: string, patch: Partial<LayerDefinition>): Promise<void>;
  removeLayer(layerId: string): Promise<void>;
  reorderLayers(layerIds: string[]): Promise<void>;

  listTemplates(): Promise<TemplateSummary[]>;
  getTemplate(templateId: string): Promise<TemplateDefinition>;
  getComponentPanel(componentId: string): Promise<ComponentPanel>;
}

export declare function defineAVSPlayerElement(): typeof AVSPlayerElement;
