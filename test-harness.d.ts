import type { Page } from '@playwright/test';
import type {
  VideoDocument,
  AssetDefinition,
  TimelineComponent,
  ValidationError,
} from './document/document.js';

export interface PlayerHarnessOptions {
  document: VideoDocument;
  playerUrl?: string;
  validate?: boolean;
  width?: number;
  height?: number;
  readyTimeout?: number;
}

export interface PlayerHarness {
  play(): Promise<void>;
  pause(): Promise<void>;
  seek(time: number): Promise<void>;
  stop(): Promise<void>;
  getDocument(): Promise<VideoDocument>;
  exportDocument(): Promise<VideoDocument>;
  getStatus(): Promise<{ state: string; currentTime: number; duration: number }>;
  getErrors(): Promise<Array<{ code: string; message: string }>>;
  getAssets(): Promise<AssetDefinition[]>;
  getTimeline(range?: { startTime?: number; endTime?: number }): Promise<TimelineComponent[]>;
  getComponent(componentId: string): Promise<TimelineComponent>;
  addComponent(definition: Partial<TimelineComponent>): Promise<TimelineComponent>;
  updateComponentParams(componentId: string, patch: Record<string, unknown>): Promise<void>;
  updateComponentTiming(componentId: string, patch: { startTime?: number; duration?: number }): Promise<void>;
  updateComponentAssets(componentId: string, patch: Record<string, string>): Promise<void>;
  removeComponent(componentId: string): Promise<void>;
  replaceDocument(doc: VideoDocument): Promise<void>;
  listTemplates(): Promise<Array<{ id: string; name: string }>>;
  getTemplate(templateId: string): Promise<{ id: string; name: string }>;
  screenshot(opts?: Record<string, unknown>): Promise<Buffer>;
  screenshotAt(time: number, opts?: { settleMs?: number }): Promise<Buffer>;
  screenshotSequence(times: number[], opts?: { settleMs?: number }): Promise<Array<{ time: number; buffer: Buffer }>>;
  destroy(): Promise<void>;
}

export declare function createPlayerHarness(page: Page, options: PlayerHarnessOptions): Promise<PlayerHarness>;

export { validateVideoDocument } from './document/document.js';
export declare const DEFAULT_PLAYER_URL: string;
