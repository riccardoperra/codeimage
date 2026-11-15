export {createConfiguration} from './lib/core/createConfiguration';
export {type AppStaticConfiguration} from './lib/types/configuration';
export {
  type LanguageDefinition,
  type LanguageIconDefinition,
  type PrettierPluginDefinition,
} from './lib/types/language-def';
export {
  type TerminalDefinition,
  type TerminalDefinitionMap,
} from './lib/types/terminal-def';
export {SUPPORTED_LOCALES} from './lib/base/locales';
export {SUPPORTED_LANGUAGES, inferLanguageFromPath} from './lib/base/languages';
export {AVAILABLE_COLORS, AVAILABLE_GRADIENTS} from './lib/base/colors';
export {
  type AspectRatio,
  type ExportTargetId,
  DEFAULT_ASPECT_RATIOS,
  getExportTarget,
} from './lib/base/aspectRatio';
