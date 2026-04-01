# @appvideostudio/sdk

> SDK for building, validating, and previewing AppVideoStudio video compositions.

## Access model

- The npm package can be installed without a separate license gate.
- The hosted `<avs-player>` runtime and Playwright harness target the AppVideoStudio iframe runtime.
- Using that hosted runtime requires an authenticated paid AppVideoStudio account.
- Embedding the hosted player on a customer-owned website requires the `studio` plan.
- `studio` includes one approved customer domain for hosted embeds.
- Additional customer domains require direct AppVideoStudio pricing approval.

## Install

```bash
npm install @appvideostudio/sdk
```

## Quick Start

### Create a video document

```js
import {
  createEmptyVideoDocument,
  validateVideoDocument,
} from '@appvideostudio/sdk';

const doc = createEmptyVideoDocument({
  name: 'My Video',
  width: 1080,
  height: 1920,
  timelineDuration: 10,
});

doc.timeline.push({
  id: 'comp-1',
  componentType: 'text-basic',
  layerId: 'layer-1',
  startTime: 0,
  duration: 5,
  params: { text: 'Hello world' },
  assetBindings: {},
  customLabel: null,
  color: '#6366f1',
});

const errors = validateVideoDocument(doc);
console.log(errors); // []
```

### Embed the player (browser)

```js
import {
  AVSPlayerElement,
  defineAVSPlayerElement,
} from '@appvideostudio/sdk/player';

defineAVSPlayerElement();

const player = document.createElement('avs-player');
document.body.appendChild(player);

await player.ready;
await player.load(doc);
await player.play();
```

> **Note:** The `<avs-player>` element creates an iframe to the AppVideoStudio player runtime at `https://create.appvideostudio.com`. The hosted runtime must be reachable for playback to work.
>
> Playback through the hosted runtime is access-controlled. Customer website embeds require `studio` and an approved embed domain.

### Test with Playwright

```js
import { test } from '@playwright/test';
import { createPlayerHarness } from '@appvideostudio/sdk/test-harness';
import { createEmptyVideoDocument } from '@appvideostudio/sdk';

test('screenshot at 2s', async ({ page }) => {
  const doc = createEmptyVideoDocument({ name: 'Test' });
  doc.timeline.push({
    id: 'comp-1',
    componentType: 'text-basic',
    layerId: 'layer-1',
    startTime: 0,
    duration: 5,
    params: { text: 'Hello' },
    assetBindings: {},
    customLabel: null,
    color: '#6366f1',
  });

  const harness = await createPlayerHarness(page, { document: doc });
  const screenshot = await harness.screenshotAt(2);
  // assert on screenshot buffer
  await harness.destroy();
});
```

> **Note:** The test harness requires `@playwright/test` as a peer dependency (`>=1.40.0`).
>
> The harness uses the hosted iframe runtime path. If the account is not entitled to that runtime, harness-based preview flows should fail with an access error rather than bypassing enforcement.

## Entry Points

| Import | Environment | Description |
|---|---|---|
| `@appvideostudio/sdk` | Node + Browser | Document helpers |
| `@appvideostudio/sdk/document` | Node + Browser | Document module directly |
| `@appvideostudio/sdk/player` | Browser only | `<avs-player>` web component |
| `@appvideostudio/sdk/test-harness` | Node (Playwright) | Test automation |

## Document Model

### VideoDocument shape

```json
{
  "schemaVersion": 1,
  "metadata": { "id": null, "name": "My Video" },
  "projectDimensions": { "width": 1080, "height": 1920 },
  "timelineDuration": 24,
  "layers": [
    { "id": "layer-1", "name": "Layer 1", "color": "#2563eb" }
  ],
  "assets": [
    {
      "id": "asset-1",
      "type": "image",
      "name": "Background",
      "url": "https://example.com/bg.png",
      "posterUrl": null,
      "duration": null,
      "width": 1080,
      "height": 1920,
      "mimeType": "image/png"
    }
  ],
  "timeline": [
    {
      "id": "comp-1",
      "componentType": "text-basic",
      "layerId": "layer-1",
      "startTime": 0,
      "duration": 5,
      "params": { "text": "Hello world" },
      "assetBindings": {},
      "customLabel": null,
      "color": "#6366f1"
    }
  ]
}
```

## API Reference

### Document Functions

#### `createEmptyVideoDocument(options?)`

Create a new empty video document with default layers.

| Option | Type | Default |
|---|---|---|
| `id` | `string` | `null` |
| `name` | `string` | `"Untitled video"` |
| `width` | `number` | `1080` |
| `height` | `number` | `1920` |
| `timelineDuration` | `number` | `24` |
| `layers` | `LayerDefinition[]` | 3 default layers |

#### `validateVideoDocument(document, options?)`

Validate a video document and return an array of `ValidationError` objects. Returns `[]` if valid.

Options: `{ knownTemplateIds?: Set<string> }` — pass a set of known template IDs to validate `componentType` references.

#### `normalizeVideoDocument(input?, options?)`

Normalize a partial or malformed document into a valid `VideoDocument`.

#### `exportVideoDocumentFromState(state?)`

Export a video document from internal editor state.

#### `getDocumentDuration(document)`

Returns the effective duration — the greater of `timelineDuration` and the end time of the last timeline component.

#### `getDocumentTimelineEnd(document)`

Returns the end time of the last timeline component.

#### `getTimelineWindow(components?, range?)`

Filter and sort timeline components that overlap a time range `{ startTime?, endTime? }`.

#### `sortTimeline(components?)`

Sort timeline components by `startTime`, then by `id`.

#### `createDefaultLayers(count?)`

Create an array of default layer definitions (default: 3).

### Constants

| Constant | Value |
|---|---|
| `DEFAULT_PROJECT_DIMENSIONS` | `{ width: 1080, height: 1920 }` |
| `DEFAULT_TIMELINE_DURATION` | `24` |
| `PLAYER_SCHEMA_VERSION` | `1` |

### Player Element

#### `defineAVSPlayerElement()`

Register the `<avs-player>` custom element. Safe to call multiple times.

#### `AVSPlayerElement`

Extends `HTMLElement`. Observed attributes: `src`, `autoplay`, `loop`, `no-controls`, `defer`, `auto-pause`.

**Properties:**
- `ready: Promise` — resolves when the player iframe is ready

**HTML attributes:**
- `defer` — waits to create the player iframe until the element first enters the viewport
- `auto-pause` — pauses playback when a playing embed scrolls out of view (does not auto-resume)

**Playback:**
- `load(document)` — load a video document
- `loadFromUrl(url)` — load a document from a URL
- `preloadAssets()` — preload all assets
- `play()` / `pause()` / `stop()` / `seek(time)` / `destroy()`

**Document:**
- `createEmptyProject(options?)` — create a new empty project
- `getDocument()` / `exportDocument()` / `replaceDocument(document)` / `validateDocument(document)`

**Status:**
- `getStatus()` / `getErrors()`

**Assets:**
- `getAssets()` / `getAsset(assetId)` / `addAsset(asset)` / `updateAsset(assetId, patch)` / `removeAsset(assetId)`

**Timeline:**
- `getTimeline(range?)` / `getComponent(componentId)` / `addComponent(definition)` / `removeComponent(componentId)` / `clearTimeline()`
- `updateComponent(componentId, patch)` / `updateComponentParams(componentId, patch)` / `updateComponentTiming(componentId, patch)` / `updateComponentAssets(componentId, patch)` / `updateComponentMetadata(componentId, patch)`
- `moveComponent(componentId, patch)` / `moveComponents(moves)`

**Layers:**
- `getLayers()` / `addLayer(patch?)` / `updateLayer(layerId, patch)` / `removeLayer(layerId)` / `reorderLayers(layerIds)`

**Templates:**
- `listTemplates()` / `getTemplate(templateId)` / `getComponentPanel(componentId)`

**Events:**
- `on(eventName, handler)` — returns unsubscribe function
- `off(eventName, handler)`

### Test Harness

#### `createPlayerHarness(page, options)`

Create a Playwright test harness.

| Option | Type | Default |
|---|---|---|
| `document` | `VideoDocument` | *required* |
| `playerUrl` | `string` | `"https://create.appvideostudio.com"` |
| `validate` | `boolean` | `true` |
| `width` | `number` | `1280` |
| `height` | `number` | `720` |
| `readyTimeout` | `number` | `15000` |

Returns a `PlayerHarness` with methods: `play`, `pause`, `seek`, `stop`, `getDocument`, `exportDocument`, `getStatus`, `getErrors`, `getAssets`, `getTimeline`, `getComponent`, `addComponent`, `updateComponentParams`, `updateComponentTiming`, `updateComponentAssets`, `removeComponent`, `replaceDocument`, `listTemplates`, `getTemplate`, `screenshot`, `screenshotAt`, `screenshotSequence`, `destroy`.

The default harness path should be treated as production access-controlled infrastructure, not a bypass around plan checks.

## Component Catalog

Browse the full interactive catalog at [appvideostudio.com/api/components](https://appvideostudio.com/api/components/).

Machine-readable metadata: [appvideostudio.com/api/catalog.json](https://appvideostudio.com/api/catalog.json)

## Examples

### Minimal embed

```html
<script type="module">
  import { defineAVSPlayerElement } from '@appvideostudio/sdk/player';
  defineAVSPlayerElement();
</script>

<avs-player src="https://create.appvideostudio.com/player/"></avs-player>
```

This embed pattern is intended for AppVideoStudio-owned properties by default. Embedding it on a customer-owned domain requires an authenticated `studio` account with that domain approved in account admin.

### Build a document programmatically

```js
import {
  createEmptyVideoDocument,
  validateVideoDocument,
} from '@appvideostudio/sdk';

const doc = createEmptyVideoDocument({
  name: 'Programmatic Video',
  timelineDuration: 15,
});

doc.assets.push({
  id: 'bg-asset',
  type: 'image',
  name: 'Background',
  url: 'https://example.com/bg.jpg',
  posterUrl: null,
  duration: null,
  width: 1080,
  height: 1920,
  mimeType: 'image/jpeg',
});

doc.timeline.push({
  id: 'bg-comp',
  componentType: 'image-fill',
  layerId: 'layer-1',
  startTime: 0,
  duration: 15,
  params: {},
  assetBindings: { source: 'bg-asset' },
  customLabel: 'Background',
  color: '#2563eb',
});

const errors = validateVideoDocument(doc);
if (errors.length === 0) {
  console.log('Document is valid:', JSON.stringify(doc, null, 2));
}
```

### Playwright screenshot test

```js
import { test, expect } from '@playwright/test';
import { createPlayerHarness } from '@appvideostudio/sdk/test-harness';
import { createEmptyVideoDocument } from '@appvideostudio/sdk';

test('visual regression at key frames', async ({ page }) => {
  const doc = createEmptyVideoDocument({ name: 'Regression Test' });
  // ... add components to doc ...

  const harness = await createPlayerHarness(page, { document: doc });

  const frames = await harness.screenshotSequence([0, 2, 5, 10]);
  for (const { time, buffer } of frames) {
    expect(buffer).toMatchSnapshot(`frame-${time}s.png`);
  }

  await harness.destroy();
});
```

### Load from URL

```js
import { defineAVSPlayerElement } from '@appvideostudio/sdk/player';

defineAVSPlayerElement();

const player = document.createElement('avs-player');
document.body.appendChild(player);

await player.ready;
await player.loadFromUrl('https://example.com/my-video.json');
await player.play();
```

## Links

- [Documentation](https://appvideostudio.com/api/sdk/)
- [Playground](https://appvideostudio.com/api/playground/)
- [Component Catalog](https://appvideostudio.com/api/components/)
- [GitHub](https://github.com/growthboot/appvideostudio-sdk)

## License

MIT
