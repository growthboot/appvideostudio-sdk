// Document helpers, works in Node.js and browser
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

// Player element, browser only
// Import from '@appvideostudio/sdk/player' in browser contexts
// or use the test harness for Playwright-based workflows
