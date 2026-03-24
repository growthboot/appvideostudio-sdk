# Changelog

## 0.1.2 — 2026-03-24

- Deployment pipeline


## 0.1.1 — 2026-03-24

- Deoloyment pipeline development


## 0.1.0 — 2026-03-23

Initial public release.

- Document model: `createEmptyVideoDocument`, `validateVideoDocument`
- Document utilities: `getDocumentDuration`, `getDocumentTimelineEnd`, `getTimelineWindow`, `sortTimeline`, `createDefaultLayers`
- Player element: `AVSPlayerElement` web component with full playback and document manipulation API
- Message protocol: postMessage-based RPC between host page and player iframe
- Test harness: Playwright-based `createPlayerHarness` with screenshot capture
- TypeScript declarations for all exports
