const PLAYER_SCHEMA_VERSION = 1;
const DEFAULT_PROJECT_DIMENSIONS = Object.freeze({
  width: 1080,
  height: 1920,
});
const DEFAULT_TIMELINE_DURATION = 24;
const DEFAULT_LAYER_COLORS = [
  '#2563eb',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
  '#f97316',
];

function cloneJson(value, fallback = null) {
  if (value === undefined) {
    return fallback;
  }
  return JSON.parse(JSON.stringify(value));
}

function toFiniteNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function normalizeString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeHexColor(value, fallback) {
  const normalized = normalizeString(value);
  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return normalized.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
    const [, r, g, b] = normalized;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

function createDefaultLayer(index) {
  return {
    id: `layer-${index + 1}`,
    name: `Layer ${index + 1}`,
    color: DEFAULT_LAYER_COLORS[index % DEFAULT_LAYER_COLORS.length],
  };
}

export function createDefaultLayers(count = 3) {
  return Array.from({ length: Math.max(1, count) }, (_, index) => createDefaultLayer(index));
}

export function getDocumentTimelineEnd(document) {
  return (Array.isArray(document?.timeline) ? document.timeline : []).reduce((maxEnd, component) => {
    const startTime = Math.max(0, toFiniteNumber(component?.startTime, 0));
    const duration = Math.max(0, toFiniteNumber(component?.duration, 0));
    return Math.max(maxEnd, startTime + duration);
  }, 0);
}

export function getDocumentDuration(document) {
  const timelineDuration = Math.max(0, toFiniteNumber(document?.timelineDuration, 0));
  return Math.max(timelineDuration, getDocumentTimelineEnd(document));
}

export function sortTimeline(components = []) {
  return [...components].sort((a, b) => {
    const aStart = toFiniteNumber(a?.startTime, 0);
    const bStart = toFiniteNumber(b?.startTime, 0);
    if (aStart !== bStart) return aStart - bStart;
    return normalizeString(a?.id).localeCompare(normalizeString(b?.id));
  });
}

export function getTimelineWindow(components = [], { startTime, endTime } = {}) {
  const hasStart = Number.isFinite(startTime);
  const hasEnd = Number.isFinite(endTime);
  if (!hasStart && !hasEnd) {
    return sortTimeline(components);
  }

  const windowStart = hasStart ? Math.max(0, startTime) : 0;
  const windowEnd = hasEnd ? Math.max(windowStart, endTime) : Number.POSITIVE_INFINITY;

  return sortTimeline(components).filter((component) => {
    const componentStart = Math.max(0, toFiniteNumber(component?.startTime, 0));
    const componentEnd = componentStart + Math.max(0, toFiniteNumber(component?.duration, 0));
    return componentStart < windowEnd && windowStart < componentEnd;
  });
}

export function createEmptyVideoDocument(options = {}) {
  const width = Math.max(1, Math.round(toFiniteNumber(options.width, DEFAULT_PROJECT_DIMENSIONS.width)));
  const height = Math.max(1, Math.round(toFiniteNumber(options.height, DEFAULT_PROJECT_DIMENSIONS.height)));
  const timelineDuration = Math.max(0.1, toFiniteNumber(options.timelineDuration, DEFAULT_TIMELINE_DURATION));

  return {
    schemaVersion: PLAYER_SCHEMA_VERSION,
    metadata: {
      id: normalizeString(options.id) || null,
      name: normalizeString(options.name) || 'Untitled video',
    },
    projectDimensions: {
      width,
      height,
    },
    timelineDuration,
    layers: createDefaultLayers(
      Array.isArray(options.layers) && options.layers.length > 0 ? options.layers.length : 3,
    ),
    assets: [],
    timeline: [],
  };
}

function normalizeMetadata(metadata = {}) {
  return {
    id: normalizeString(metadata?.id) || null,
    name: normalizeString(metadata?.name) || 'Untitled video',
  };
}

function normalizeProjectDimensions(projectDimensions = {}) {
  return {
    width: Math.max(1, Math.round(toFiniteNumber(projectDimensions?.width, DEFAULT_PROJECT_DIMENSIONS.width))),
    height: Math.max(1, Math.round(toFiniteNumber(projectDimensions?.height, DEFAULT_PROJECT_DIMENSIONS.height))),
  };
}

function normalizeLayers(layers = []) {
  const sourceLayers = Array.isArray(layers) && layers.length > 0 ? layers : createDefaultLayers();
  return sourceLayers.map((layer, index) => ({
    id: normalizeString(layer?.id) || `layer-${index + 1}`,
    name: normalizeString(layer?.name) || `Layer ${index + 1}`,
    color: normalizeHexColor(layer?.color, DEFAULT_LAYER_COLORS[index % DEFAULT_LAYER_COLORS.length]),
  }));
}

function normalizeAssets(assets = []) {
  return (Array.isArray(assets) ? assets : []).map((asset, index) => ({
    id: normalizeString(asset?.id) || `asset-${index + 1}`,
    type: normalizeString(asset?.type) || 'image',
    name: normalizeString(asset?.name) || `Asset ${index + 1}`,
    url: normalizeString(asset?.url),
    posterUrl: normalizeString(asset?.posterUrl) || null,
    duration: asset?.duration == null ? null : Math.max(0, toFiniteNumber(asset.duration, 0)),
    width: asset?.width == null ? null : Math.max(1, Math.round(toFiniteNumber(asset.width, 1))),
    height: asset?.height == null ? null : Math.max(1, Math.round(toFiniteNumber(asset.height, 1))),
    mimeType: normalizeString(asset?.mimeType) || null,
  }));
}

function normalizeTimeline(timeline = []) {
  return sortTimeline(Array.isArray(timeline) ? timeline : []).map((component, index) => ({
    id: normalizeString(component?.id) || `comp-${index + 1}`,
    componentType: normalizeString(component?.componentType),
    layerId: normalizeString(component?.layerId) || null,
    startTime: Math.max(0, toFiniteNumber(component?.startTime, 0)),
    duration: Math.max(0.1, toFiniteNumber(component?.duration, 0.1)),
    params: cloneJson(component?.params, {}),
    assetBindings: cloneJson(component?.assetBindings, {}),
    customLabel: normalizeString(component?.customLabel) || null,
    color: normalizeHexColor(component?.color, '#6366f1'),
  }));
}

export function normalizeVideoDocument(input = {}, options = {}) {
  const base = createEmptyVideoDocument(options);
  const normalized = {
    schemaVersion: PLAYER_SCHEMA_VERSION,
    metadata: normalizeMetadata(input?.metadata),
    projectDimensions: normalizeProjectDimensions(input?.projectDimensions),
    timelineDuration: Math.max(
      0.1,
      toFiniteNumber(input?.timelineDuration, base.timelineDuration),
    ),
    layers: normalizeLayers(input?.layers),
    assets: normalizeAssets(input?.assets),
    timeline: normalizeTimeline(input?.timeline),
  };

  if (normalizeString(input?.metadata?.id)) {
    normalized.metadata.id = normalizeString(input.metadata.id);
  }
  if (normalizeString(input?.metadata?.name)) {
    normalized.metadata.name = normalizeString(input.metadata.name);
  }

  return normalized;
}

export function validateVideoDocument(document, options = {}) {
  const errors = [];
  const normalized = normalizeVideoDocument(document, options);
  const assetIds = new Set();
  const layerIds = new Set();
  const componentIds = new Set();
  const templateIds = options?.knownTemplateIds instanceof Set ? options.knownTemplateIds : null;

  if (document?.schemaVersion !== PLAYER_SCHEMA_VERSION) {
    errors.push({
      code: 'invalid_schema_version',
      path: 'schemaVersion',
      message: `schemaVersion must be ${PLAYER_SCHEMA_VERSION}`,
    });
  }

  for (const layer of normalized.layers) {
    if (layerIds.has(layer.id)) {
      errors.push({
        code: 'duplicate_layer_id',
        path: 'layers',
        message: `Duplicate layer id "${layer.id}"`,
      });
      continue;
    }
    layerIds.add(layer.id);
  }

  for (const asset of normalized.assets) {
    if (!asset.url) {
      errors.push({
        code: 'asset_url_required',
        path: `assets.${asset.id}`,
        message: `Asset "${asset.id}" is missing a URL`,
      });
    }
    if (assetIds.has(asset.id)) {
      errors.push({
        code: 'duplicate_asset_id',
        path: 'assets',
        message: `Duplicate asset id "${asset.id}"`,
      });
      continue;
    }
    assetIds.add(asset.id);
  }

  for (const component of normalized.timeline) {
    if (componentIds.has(component.id)) {
      errors.push({
        code: 'duplicate_component_id',
        path: 'timeline',
        message: `Duplicate component id "${component.id}"`,
      });
      continue;
    }
    componentIds.add(component.id);

    if (!component.componentType) {
      errors.push({
        code: 'component_type_required',
        path: `timeline.${component.id}`,
        message: `Component "${component.id}" is missing componentType`,
      });
    } else if (templateIds && !templateIds.has(component.componentType)) {
      errors.push({
        code: 'unknown_component_type',
        path: `timeline.${component.id}`,
        message: `Component "${component.id}" references unknown template "${component.componentType}"`,
      });
    }

    if (!component.layerId || !layerIds.has(component.layerId)) {
      errors.push({
        code: 'invalid_layer_reference',
        path: `timeline.${component.id}`,
        message: `Component "${component.id}" references missing layer "${component.layerId || ''}"`,
      });
    }

    if (!(component.duration > 0)) {
      errors.push({
        code: 'invalid_component_duration',
        path: `timeline.${component.id}`,
        message: `Component "${component.id}" must have a duration greater than 0`,
      });
    }

    for (const [slotId, assetId] of Object.entries(component.assetBindings || {})) {
      if (!assetId) continue;
      if (!assetIds.has(assetId)) {
        errors.push({
          code: 'invalid_asset_reference',
          path: `timeline.${component.id}.assetBindings.${slotId}`,
          message: `Component "${component.id}" references missing asset "${assetId}"`,
        });
      }
    }
  }

  return errors;
}

export function exportVideoDocumentFromState(state = {}) {
  return normalizeVideoDocument({
    schemaVersion: PLAYER_SCHEMA_VERSION,
    metadata: cloneJson(state.metadata, {}),
    projectDimensions: cloneJson(state.projectDimensions, DEFAULT_PROJECT_DIMENSIONS),
    timelineDuration: toFiniteNumber(state.timelineDuration, DEFAULT_TIMELINE_DURATION),
    layers: cloneJson(state.layers, []),
    assets: cloneJson(state.assets, []),
    timeline: cloneJson(state.timeline, []),
  });
}

export {
  DEFAULT_PROJECT_DIMENSIONS,
  DEFAULT_TIMELINE_DURATION,
  PLAYER_SCHEMA_VERSION,
};
