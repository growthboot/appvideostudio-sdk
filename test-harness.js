import { validateVideoDocument } from './document/document.js';

const DEFAULT_PLAYER_URL = 'https://create.appvideostudio.com';

/**
 * Creates a Playwright-based test harness for previewing and verifying
 * AppVideoStudio video compositions.
 *
 * @param {import('@playwright/test').Page} page - Playwright page instance
 * @param {object} options
 * @param {object} options.document - Video document to load
 * @param {string} [options.playerUrl] - Base URL of the player runtime
 * @param {boolean} [options.validate=true] - Validate document before loading
 * @param {number} [options.width=1280] - Viewport width
 * @param {number} [options.height=720] - Viewport height
 * @param {number} [options.readyTimeout=15000] - Timeout waiting for player ready (ms)
 * @returns {Promise<PlayerHarness>}
 */
export async function createPlayerHarness(page, options = {}) {
  const {
    document: videoDocument,
    playerUrl = DEFAULT_PLAYER_URL,
    validate = true,
    width = 1280,
    height = 720,
    readyTimeout = 15000,
  } = options;

  if (!videoDocument) {
    throw new Error('createPlayerHarness requires a document option');
  }

  if (validate) {
    const errors = validateVideoDocument(videoDocument);
    if (errors.length > 0) {
      const messages = errors.map((e) => `  [${e.code}] ${e.message}`).join('\n');
      throw new Error(`Invalid video document:\n${messages}`);
    }
  }

  await page.setViewportSize({ width, height });

  const playerApiUrl = `${playerUrl}/player/api`;

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; background: #0d1117; }
        avs-player { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <script type="module" src="${playerApiUrl}"></script>
      <avs-player id="harness-player"></avs-player>
    </body>
    </html>
  `);

  const playerHandle = await page.evaluateHandle(
    async ({ doc, timeout }) => {
      const player = window.document.getElementById('harness-player');
      if (!player) throw new Error('Player element not found');

      await Promise.race([
        player.ready,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Player ready timeout')), timeout),
        ),
      ]);

      await player.load(doc);
      await player.preloadAssets();
      return player;
    },
    { doc: videoDocument, timeout: readyTimeout },
  );

  return {
    /** Start playback */
    play() {
      return page.evaluate((p) => p.play(), playerHandle);
    },

    /** Pause playback */
    pause() {
      return page.evaluate((p) => p.pause(), playerHandle);
    },

    /** Seek to a specific time in seconds */
    seek(time) {
      return page.evaluate((p, t) => p.seek(t), playerHandle, time);
    },

    /** Stop playback and reset to beginning */
    stop() {
      return page.evaluate((p) => p.stop(), playerHandle);
    },

    /** Get the current document */
    getDocument() {
      return page.evaluate((p) => p.getDocument(), playerHandle);
    },

    /** Export the document in shareable format */
    exportDocument() {
      return page.evaluate((p) => p.exportDocument(), playerHandle);
    },

    /** Get player status */
    getStatus() {
      return page.evaluate((p) => p.getStatus(), playerHandle);
    },

    /** Get player errors */
    getErrors() {
      return page.evaluate((p) => p.getErrors(), playerHandle);
    },

    /** Get all assets */
    getAssets() {
      return page.evaluate((p) => p.getAssets(), playerHandle);
    },

    /** Get timeline components */
    getTimeline(range) {
      return page.evaluate((p, r) => p.getTimeline(r), playerHandle, range);
    },

    /** Get a specific component */
    getComponent(componentId) {
      return page.evaluate((p, id) => p.getComponent(id), playerHandle, componentId);
    },

    /** Add a component to the timeline */
    addComponent(definition) {
      return page.evaluate((p, d) => p.addComponent(d), playerHandle, definition);
    },

    /** Update component params */
    updateComponentParams(componentId, patch) {
      return page.evaluate((p, id, pa) => p.updateComponentParams(id, pa), playerHandle, componentId, patch);
    },

    /** Update component timing */
    updateComponentTiming(componentId, patch) {
      return page.evaluate((p, id, pa) => p.updateComponentTiming(id, pa), playerHandle, componentId, patch);
    },

    /** Update component asset bindings */
    updateComponentAssets(componentId, patch) {
      return page.evaluate((p, id, pa) => p.updateComponentAssets(id, pa), playerHandle, componentId, patch);
    },

    /** Remove a component */
    removeComponent(componentId) {
      return page.evaluate((p, id) => p.removeComponent(id), playerHandle, componentId);
    },

    /** Replace the entire document */
    replaceDocument(doc) {
      return page.evaluate((p, d) => p.replaceDocument(d), playerHandle, doc);
    },

    /** List available templates */
    listTemplates() {
      return page.evaluate((p) => p.listTemplates(), playerHandle);
    },

    /** Get a template definition */
    getTemplate(templateId) {
      return page.evaluate((p, id) => p.getTemplate(id), playerHandle, templateId);
    },

    /** Take a screenshot of the current frame */
    screenshot(opts) {
      return page.screenshot(opts);
    },

    /** Seek to a specific time and take a screenshot after rendering settles */
    async screenshotAt(time, opts = {}) {
      const { settleMs = 300, ...screenshotOpts } = opts;
      await page.evaluate((p, t) => p.seek(t), playerHandle, time);
      await page.waitForTimeout(settleMs);
      return page.screenshot(screenshotOpts);
    },

    /** Take screenshots at multiple timestamps, returns array of buffers */
    async screenshotSequence(times, opts = {}) {
      const screenshots = [];
      for (const time of times) {
        const buffer = await this.screenshotAt(time, opts);
        screenshots.push({ time, buffer });
      }
      return screenshots;
    },

    /** Destroy the player and clean up */
    async destroy() {
      await page.evaluate((p) => p.destroy(), playerHandle).catch(() => null);
    },
  };
}

export { validateVideoDocument, DEFAULT_PLAYER_URL };
