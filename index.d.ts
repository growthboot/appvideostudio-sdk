export {
  createEmptyVideoDocument,
  validateVideoDocument,
  normalizeVideoDocument,
  exportVideoDocumentFromState,
  getDocumentTimelineEnd,
  getDocumentDuration,
  getTimelineWindow,
  sortTimeline,
  createDefaultLayers,
  DEFAULT_PROJECT_DIMENSIONS,
  DEFAULT_TIMELINE_DURATION,
  PLAYER_SCHEMA_VERSION,
} from './document/document.js';

export type {
  VideoDocument,
  LayerDefinition,
  AssetDefinition,
  TimelineComponent,
  ValidationError,
  CreateDocumentOptions,
  ValidateDocumentOptions,
  TimelineWindowRange,
} from './document/document.js';
