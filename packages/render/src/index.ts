export {
  ANIMATION_DEFAULTS,
  ANIMATION_FPS,
  animationDocumentSchema,
  parseAnimationDocument,
  parseAnimationSettings,
  parseEasing,
  parseSnapshotDocument,
  SUPPORTED_SNAPSHOT_MAJOR,
  projectSnapshotSchema,
  snapshotDocumentSchema,
} from './document';
export type {
  AnimationDocument,
  AnimationEasing,
  AnimationHeader,
  AnimationInput,
  AnimationSettings,
  AnimationStepSettings,
  ProjectSnapshot,
  SnapshotDocument,
  SnapshotInput,
} from './document';
export {
  animationFps,
  createRenderer,
  annotateCode,
  renderAnimation,
  renderSnapshot,
  snapshotMarkup,
  supportedFontIds,
  supportedThemeIds,
} from './render';
export type {
  AnimationFrame,
  RawAnimation,
  AnnotatedCode,
  SnapshotFont,
  SnapshotMarkup,
} from './render';

export {openFontCache, FontUnavailableError, FontFileError} from './fontCache';
export type {
  FontCacheOptions,
  FontEvent,
  FontStatus,
  FontCache,
} from './fontCache';
export type {RendererOptions} from './render';
export {resolveFontId} from './fontManifest';
