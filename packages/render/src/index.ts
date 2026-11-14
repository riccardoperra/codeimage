export {
  ANIMATION_DEFAULTS,
  animationDocumentSchema,
  animationSettingsSchema,
  parseAnimationDocument,
  parseSnapshotDocument,
  SUPPORTED_SNAPSHOT_MAJOR,
  projectSnapshotSchema,
  snapshotDocumentSchema,
} from './document';
export type {
  AnimationDocument,
  AnimationInput,
  AnimationSettings,
  ProjectSnapshot,
  SnapshotDocument,
  SnapshotInput,
} from './document';
export {
  animationFps,
  annotateCode,
  renderAnimation,
  renderSnapshot,
  snapshotMarkup,
  supportedFontIds,
  supportedThemeIds,
} from './render';
export type {AnnotatedCode, SnapshotFont, SnapshotMarkup} from './render';
