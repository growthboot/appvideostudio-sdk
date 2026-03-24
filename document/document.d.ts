export interface VideoDocument {
  schemaVersion: number;
  metadata: { id: string | null; name: string };
  projectDimensions: { width: number; height: number };
  timelineDuration: number;
  layers: LayerDefinition[];
  assets: AssetDefinition[];
  timeline: TimelineComponent[];
}

export interface LayerDefinition {
  id: string;
  name: string;
  color: string;
}

export interface AssetDefinition {
  id: string;
  type: 'video' | 'image' | 'audio' | 'font';
  name: string;
  url: string;
  posterUrl: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
}

export interface TimelineComponent {
  id: string;
  componentType: string;
  layerId: string | null;
  startTime: number;
  duration: number;
  params: Record<string, unknown>;
  assetBindings: Record<string, string>;
  customLabel: string | null;
  color: string;
}

export interface ValidationError {
  code: string;
  path: string;
  message: string;
}

export interface CreateDocumentOptions {
  id?: string;
  name?: string;
  width?: number;
  height?: number;
  timelineDuration?: number;
  layers?: Partial<LayerDefinition>[];
}

export interface ValidateDocumentOptions {
  knownTemplateIds?: Set<string>;
}

export interface TimelineWindowRange {
  startTime?: number;
  endTime?: number;
}

export declare const PLAYER_SCHEMA_VERSION: number;
export declare const DEFAULT_PROJECT_DIMENSIONS: Readonly<{ width: 1080; height: 1920 }>;
export declare const DEFAULT_TIMELINE_DURATION: number;

export declare function createEmptyVideoDocument(options?: CreateDocumentOptions): VideoDocument;
export declare function validateVideoDocument(document: unknown, options?: ValidateDocumentOptions): ValidationError[];
export declare function normalizeVideoDocument(input?: unknown, options?: CreateDocumentOptions): VideoDocument;
export declare function exportVideoDocumentFromState(state?: Partial<VideoDocument>): VideoDocument;
export declare function getDocumentTimelineEnd(document: Pick<VideoDocument, 'timeline'>): number;
export declare function getDocumentDuration(document: Pick<VideoDocument, 'timeline' | 'timelineDuration'>): number;
export declare function getTimelineWindow(components?: TimelineComponent[], range?: TimelineWindowRange): TimelineComponent[];
export declare function sortTimeline(components?: TimelineComponent[]): TimelineComponent[];
export declare function createDefaultLayers(count?: number): LayerDefinition[];
