import {
  AVAILABLE_COLORS,
  AVAILABLE_GRADIENTS,
  DEFAULT_ASPECT_RATIOS,
  getExportTarget,
  SUPPORTED_LANGUAGES,
} from '@codeimage/config';
import type {CustomTheme} from '@codeimage/highlight';
import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import type {
  FrameSignature,
  SignaturePlatform,
  SignaturePosition,
  SignatureStyle,
} from '@codeimage/store/frame/model';
import {SIGNATURE_STYLES} from '@codeimage/store/frame/model';
import {dispatchUpdateTheme} from '@codeimage/store/effects/onThemeChange';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {appEnvironment} from '@core/configuration';
import {shadowsLabel} from '@core/configuration/shadow';
import {getUmami} from '@core/constants/umami';
import type {Accessor, Component} from 'solid-js';
import {createMemo, createSelector} from 'solid-js';
import {FontPicker} from '../../components/PropertyEditor/controls/FontPicker/FontPicker';
import {ImagePicker} from '../../components/PropertyEditor/controls/ImagePicker/ImagePicker';
import {SavedSignaturesField} from './controls/SavedSignatures';
import {
  SignatureAvatarField,
  SignatureHandleField,
  SignatureNameField,
  SignatureProfileField,
} from './controls/SignatureFields';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {
  createAmbientBackground,
  createWindowPalette,
} from '../../components/Terminal/windowPalette';
import type {AppLocaleEntries} from '../../i18n';
import type {PreviewSession} from './preview';
import {createPreviewSession} from './preview';
import type {SyntaxColors} from './syntax';
import {readSyntaxColors} from './syntax';

export type SectionId = 'frame' | 'signature' | 'window' | 'editor' | 'font';

export type ControlId =
  | 'frame.padding'
  | 'frame.radius'
  | 'frame.visible'
  | 'frame.opacity'
  | 'frame.background'
  | 'frame.backgroundImage'
  | 'frame.aspectRatio'
  | 'signature.saved'
  | 'signature.handle'
  | 'signature.style'
  | 'signature.platform'
  | 'signature.name'
  | 'signature.avatar'
  | 'signature.profile'
  | 'signature.position'
  | 'window.surface'
  | 'window.backgroundType'
  | 'window.header'
  | 'window.style'
  | 'window.accent'
  | 'window.reflection'
  | 'window.watermark'
  | 'window.shadow'
  | 'window.border'
  | 'editor.language'
  | 'editor.theme'
  | 'editor.formatter'
  | 'editor.lineNumbers'
  | 'editor.lineNumberStart'
  | 'font.family'
  | 'font.weight'
  | 'font.ligatures';

interface ControlBase<K extends string> {
  readonly kind: K;
  readonly id: ControlId;
  readonly label: Accessor<string>;
  /** False when today's sidebar hides the row, e.g. opacity while the frame is hidden. */
  readonly visible: Accessor<boolean>;
}

export interface ToggleControl extends ControlBase<'toggle'> {
  readonly value: Accessor<boolean>;
  readonly set: (value: boolean) => void;
  /** Shows the value on the canvas without saving it, until `set()` or `endPreview()`. */
  readonly preview: (value: boolean) => void;
}

export interface ChoiceOption {
  /** The option's value as a string; doubles as a DOM key and a native `<option value>`. */
  readonly key: string;
  readonly label: string;
}

interface ChoiceControl<
  K extends 'segmented' | 'select',
> extends ControlBase<K> {
  readonly options: Accessor<readonly ChoiceOption[]>;
  /** Key of the selected option. Matches no option when the store holds a value outside the list. */
  readonly value: Accessor<string>;
  readonly set: (key: string) => void;
  /** Shows the option on the canvas without saving it, until `set()` or `endPreview()`. */
  readonly preview: (key: string) => void;
  readonly disabled: Accessor<boolean>;
}

export type SegmentedControl = ChoiceControl<'segmented'>;
export type SelectControl = ChoiceControl<'select'>;

export interface RangeControl extends ControlBase<'range'> {
  readonly value: Accessor<number>;
  readonly set: (value: number) => void;
  /** Shows the value on the canvas without saving it, until `set()` or `endPreview()`. */
  readonly preview: (value: number) => void;
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

export interface NumberControl extends ControlBase<'number'> {
  readonly value: Accessor<number>;
  readonly set: (value: number) => void;
  readonly min: number;
  readonly max: number;
}

export interface BackgroundControl extends ControlBase<'background'> {
  /** Any CSS background: a color, a gradient, or an uploaded asset id. */
  readonly value: Accessor<string>;
  readonly set: (value: string) => void;
  readonly colors: readonly string[];
  readonly gradients: readonly string[];
  readonly ambient: Accessor<{label: string; value: string}>;
  readonly preview: (value: string) => void;
  readonly endPreview: () => void;
}

/** Renders the production control as is, already bound to the store. */
export interface CustomControl extends ControlBase<'custom'> {
  /** Gets the id the row's label points at. */
  readonly Control: Component<{id?: string}>;
}

export type Control =
  | ToggleControl
  | SegmentedControl
  | SelectControl
  | RangeControl
  | NumberControl
  | BackgroundControl
  | CustomControl;

export interface Section {
  readonly id: SectionId;
  readonly label: Accessor<string>;
  readonly controls: readonly Control[];
}

export interface ThemeEntry {
  readonly id: string;
  readonly name: string;
  readonly dark: boolean;
  readonly colors: {
    /** CSS background of the frame behind the window, often a gradient. */
    readonly background: string;
    readonly window: string;
    readonly text: string;
    /** The colours the code editor gives these tokens in this theme. */
    readonly syntax: SyntaxColors;
  };
  /** The applied theme. Stays on it while another theme is previewed. */
  readonly active: Accessor<boolean>;
  /** Same as clicking a theme card today: also replaces the frame background. */
  readonly apply: () => void;
  /** Shows the theme on the canvas without saving it, until `apply()` or `endPreview()`. */
  readonly preview: () => void;
}

export interface EditorControlsModel {
  readonly sections: readonly Section[];
  readonly control: (id: ControlId) => Control | undefined;
  /** Registry order. Grows while theme modules load. */
  readonly themes: Accessor<readonly ThemeEntry[]>;
  /**
   * Shows a write to the stores on the canvas without saving it or sending
   * analytics. Each preview, of a theme or a control, first undoes the last.
   */
  readonly preview: (write: () => void) => void;
  /** Undoes the running preview. Every `set()` and `apply()` also ends it first. */
  readonly endPreview: () => void;
}

type OptionValue = string | number | boolean | null;

interface ChoiceSpec<T extends OptionValue> {
  readonly id: ControlId;
  readonly label: Accessor<string>;
  readonly options: Accessor<readonly {label: string; value: T}[]>;
  readonly value: Accessor<T>;
  /** Writes the value to the store. A preview runs it too. */
  readonly set: (value: T) => void;
  /** Writes for a preview when `set` does more than show the value. */
  readonly show?: (value: T) => void;
  /** Side effects of a saved change only, such as analytics. */
  readonly track?: (value: T) => void;
  readonly visible?: Accessor<boolean>;
  readonly disabled?: Accessor<boolean>;
}

const always = () => true;
const never = () => false;

function makeChoice<K extends 'segmented' | 'select', T extends OptionValue>(
  session: PreviewSession,
  kind: K,
  spec: ChoiceSpec<T>,
): ChoiceControl<K> {
  const find = (key: string) =>
    spec.options().find(option => String(option.value) === key);
  return {
    kind,
    id: spec.id,
    label: spec.label,
    visible: spec.visible ?? always,
    disabled: spec.disabled ?? never,
    options: () =>
      spec.options().map(option => ({
        key: String(option.value),
        label: option.label,
      })),
    value: () => String(spec.value()),
    set: key => {
      const option = find(key);
      if (!option) return;
      session.commit(() => {
        spec.set(option.value);
        spec.track?.(option.value);
      });
    },
    preview: key => {
      const option = find(key);
      if (option) session.show(() => (spec.show ?? spec.set)(option.value));
    },
  };
}

/** `set` and `preview` for a control whose write has no side effects. */
function writes<T>(session: PreviewSession, write: (value: T) => void) {
  return {
    set: (value: T) => session.commit(() => write(value)),
    preview: (value: T) => session.show(() => write(value)),
  };
}

const languages = [...SUPPORTED_LANGUAGES].sort((a, b) => {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  if (a.featured) {
    return SUPPORTED_LANGUAGES.indexOf(a) - SUPPORTED_LANGUAGES.indexOf(b);
  }
  return a.label.localeCompare(b.label);
});

export function createEditorControlsModel(): EditorControlsModel {
  const [t] = useI18n<AppLocaleEntries>();
  const frame = getFrameState();
  const terminal = getTerminalState();
  const editor = getRootEditorStore();
  const activeEditor = getActiveEditorStore();
  const themeStore = getThemeStore();
  const shadows = createMemo(shadowsLabel);
  const session = createPreviewSession();
  const isActiveTheme = createSelector(
    () => session.saved()?.options.themeId ?? editor.state.options.themeId,
  );
  const choice = <K extends 'segmented' | 'select', T extends OptionValue>(
    kind: K,
    spec: ChoiceSpec<T>,
  ) => makeChoice(session, kind, spec);
  const write = <T,>(set: (value: T) => void) => writes(session, set);
  const commit =
    <T,>(set: (value: T) => void) =>
    (value: T) =>
      session.commit(() => set(value));

  // What dispatchUpdateTheme writes, without its analytics and its async load.
  const showTheme = (theme: CustomTheme, background: boolean) => {
    if (background)
      frame.setStore('background', theme.properties.previewBackground);
    terminal.setState('background', theme.properties.terminal.main);
    terminal.setState('textColor', theme.properties.terminal.text);
    editor.actions.setThemeId(theme.id);
  };

  // Reading a resource before it is ready would suspend the caller's
  // boundary, so only settled themes are read.
  const loadedThemes = createMemo(() =>
    themeStore.themeArray().flatMap((resource): CustomTheme[] => {
      const theme = resource.state === 'ready' ? resource() : undefined;
      return theme ? [theme] : [];
    }),
  );

  const themes = createMemo(() =>
    loadedThemes().map((theme): ThemeEntry => ({
      id: theme.id,
      name: theme.properties.label,
      dark: theme.properties.darkMode,
      colors: {
        background: theme.properties.previewBackground,
        window: theme.properties.terminal.main,
        text: theme.properties.terminal.text,
        syntax: readSyntaxColors(theme),
      },
      active: () => isActiveTheme(theme.id),
      apply: () =>
        session.commit(() => {
          dispatchUpdateTheme({theme, updateBackground: true});
          getUmami().track('theme-change', {themeId: theme.id});
        }),
      preview: () => session.show(() => showTheme(theme, true)),
    })),
  );

  const frameVisible = () => frame.store.visible;
  const signature = () => frame.store.signature;
  const hasSignature = () => !!signature();
  const isCard = () => signature()?.style === 'card';
  const patchSignature = (patch: Partial<FrameSignature>) => {
    const current = signature();
    if (current) frame.setSignature({...current, ...patch});
  };
  const headerVisible = () => terminal.state.showHeader;
  const formatters = () => activeEditor.formatter.availableFormatters();

  const sections: readonly Section[] = [
    {
      id: 'frame',
      label: () => t('frame.frame'),
      controls: [
        choice('select', {
          id: 'frame.padding',
          label: () => t('frame.padding'),
          options: () =>
            appEnvironment.editorPadding.map(padding => ({
              label: padding.label,
              value: Number(padding.value),
            })),
          value: () => frame.store.padding,
          set: frame.setPadding,
        }),
        choice('segmented', {
          id: 'frame.radius',
          label: () => t('frame.radius'),
          options: () => appEnvironment.editorRadius,
          value: () => frame.store.radius,
          set: frame.setRadius,
        }),
        {
          kind: 'toggle',
          id: 'frame.visible',
          label: () => t('frame.visible'),
          visible: always,
          value: frameVisible,
          ...write(frame.setVisibility),
        },
        {
          kind: 'range',
          id: 'frame.opacity',
          label: () => t('frame.opacity'),
          visible: frameVisible,
          value: () => frame.store.opacity,
          ...write(frame.setOpacity),
          min: 0,
          max: 100,
          step: 1,
        },
        {
          kind: 'background',
          id: 'frame.background',
          label: () => t('frame.background'),
          visible: frameVisible,
          value: () => frame.store.background ?? '',
          ...write(frame.setBackground),
          endPreview: session.end,
          ambient: () => {
            const theme = loadedThemes().find(
              theme => theme.id === editor.state.options.themeId,
            );
            return {
              label: t('frame.ambientBackground'),
              value: createAmbientBackground(
                createWindowPalette({
                  background: terminal.state.background,
                  text: terminal.state.textColor,
                  accent:
                    theme?.properties.terminal.accent ??
                    theme?.properties.terminal.text,
                }),
              ),
            };
          },
          colors: AVAILABLE_COLORS,
          gradients: AVAILABLE_GRADIENTS,
        },
        {
          kind: 'custom',
          id: 'frame.backgroundImage',
          label: () => 'Background image',
          visible: frameVisible,
          Control: () => (
            <ImagePicker
              value={frame.store.background ?? undefined}
              onChange={assetId =>
                frame.setBackground(assetId || AVAILABLE_GRADIENTS[0])
              }
            />
          ),
        },
        choice<'select', string | null>('select', {
          id: 'frame.aspectRatio',
          label: () => t('frame.aspectRatio'),
          options: () => [
            {label: t('frame.freeSize'), value: null},
            ...DEFAULT_ASPECT_RATIOS.map(ratio => ({
              label:
                ratio.kind === 'target'
                  ? t(`frame.targets.${ratio.id}`)
                  : ratio.name,
              value: ratio.kind === 'target' ? ratio.id : ratio.ratio,
            })),
          ],
          value: () => frame.store.exportTarget ?? frame.store.aspectRatio,
          set: value => {
            const target = getExportTarget(value);
            if (target) frame.setExportTarget(target.id);
            else frame.setAspectRatio(value);
          },
          track: ratio =>
            getUmami().track('aspect-ratio', {ratio: ratio ?? 'unset'}),
        }),
      ],
    },
    {
      id: 'signature',
      label: () => t('signature.title'),
      controls: [
        {
          kind: 'custom',
          id: 'signature.saved',
          label: () => t('savedSignatures.saved'),
          visible: always,
          Control: SavedSignaturesField,
        },
        {
          kind: 'custom',
          id: 'signature.handle',
          label: () => t('signature.handle'),
          visible: always,
          Control: SignatureHandleField,
        },
        choice<'segmented', SignatureStyle>('segmented', {
          id: 'signature.style',
          label: () => t('signature.style'),
          visible: hasSignature,
          options: () =>
            SIGNATURE_STYLES.map(style => ({
              label: t(`signature.${style}`),
              value: style,
            })),
          value: () => signature()?.style ?? 'minimal',
          set: style => patchSignature({style}),
        }),
        choice<'segmented', SignaturePlatform | null>('segmented', {
          id: 'signature.platform',
          label: () => t('signature.icon'),
          visible: hasSignature,
          options: () => [
            {label: t('signature.noIcon'), value: null},
            {label: 'X', value: 'x'},
            {label: 'Bluesky', value: 'bluesky'},
            {label: 'GitHub', value: 'github'},
            {label: 'Mastodon', value: 'mastodon'},
            {label: 'LinkedIn', value: 'linkedin'},
          ],
          value: () => signature()?.platform ?? null,
          set: platform => patchSignature({platform}),
        }),
        {
          kind: 'custom',
          id: 'signature.name',
          label: () => t('signature.name'),
          visible: isCard,
          Control: SignatureNameField,
        },
        {
          kind: 'custom',
          id: 'signature.avatar',
          label: () => t('signature.avatar'),
          visible: isCard,
          Control: SignatureAvatarField,
        },
        {
          kind: 'custom',
          id: 'signature.profile',
          label: () => t('signature.profile'),
          visible: () => isCard() && signature()?.avatar === 'profile',
          Control: SignatureProfileField,
        },
        choice<'segmented', SignaturePosition>('segmented', {
          id: 'signature.position',
          label: () => t('signature.position'),
          visible: hasSignature,
          options: () => [
            {label: t('signature.left'), value: 'bottom-left'},
            {label: t('signature.center'), value: 'bottom-center'},
            {label: t('signature.right'), value: 'bottom-right'},
          ],
          value: () => signature()?.position ?? 'bottom-right',
          set: position => patchSignature({position}),
        }),
      ],
    },
    {
      id: 'window',
      label: () => t('frame.terminal'),
      controls: [
        choice('segmented', {
          id: 'window.backgroundType',
          label: () => t('frame.backgroundType'),
          options: () => [
            {label: 'Default', value: false},
            {label: 'Alternative', value: true},
          ],
          value: () => terminal.state.alternativeTheme,
          set: terminal.setAlternativeTheme,
        }),
        {
          kind: 'toggle',
          id: 'window.header',
          label: () => t('frame.header'),
          visible: always,
          value: headerVisible,
          ...write(terminal.setShowHeader),
        },
        choice('select', {
          id: 'window.style',
          label: () => t('frame.terminal'),
          visible: headerVisible,
          options: () =>
            Object.values(AVAILABLE_TERMINAL_THEMES.entries).map(entry => ({
              label: t(entry.label),
              value: entry.name,
            })),
          value: () => terminal.state.type,
          set: terminal.setType,
          track: type => getUmami().track('change-terminal-type', {type}),
        }),
        choice('segmented', {
          id: 'window.surface',
          label: () => t('frame.windowSurface'),
          options: () => [
            {label: t('frame.surfaceSolid'), value: 'solid' as const},
            {label: t('frame.surfaceWash'), value: 'wash' as const},
          ],
          value: () => terminal.state.surface,
          set: terminal.setSurface,
        }),
        {
          kind: 'toggle',
          id: 'window.accent',
          label: () => t('frame.tabAccent'),
          visible: headerVisible,
          value: () => terminal.state.accentVisible,
          ...write(terminal.setAccentVisible),
        },
        {
          kind: 'toggle',
          id: 'window.reflection',
          label: () => t('frame.reflection'),
          visible: always,
          value: () => terminal.state.showGlassReflection,
          ...write(terminal.setShowGlassReflection),
        },
        {
          kind: 'toggle',
          id: 'window.watermark',
          label: () => t('frame.watermark'),
          visible: always,
          value: () => terminal.state.showWatermark,
          ...write(terminal.setShowWatermark),
        },
        choice<'select', string | null>('select', {
          id: 'window.shadow',
          label: () => t('frame.shadow'),
          options: shadows,
          value: () => terminal.state.shadow,
          set: terminal.setShadow,
          track: shadow =>
            getUmami().track('change-shadow', {shadow: shadow ?? 'none'}),
        }),
        choice('select', {
          id: 'window.border',
          label: () => t('frame.border'),
          options: () => [
            {label: t('frame.borderNone'), value: 'none'},
            {label: t('frame.borderGlass'), value: 'glass'},
            {label: t('frame.borderHairline'), value: 'hairline'},
          ],
          value: () => terminal.state.borderType ?? 'none',
          set: border => terminal.setBorder(border === 'none' ? null : border),
          track: border => {
            getUmami().track('change-border', {border});
          },
        }),
      ],
    },
    {
      id: 'editor',
      label: () => t('frame.editor'),
      controls: [
        choice('select', {
          id: 'editor.language',
          label: () => t('frame.language'),
          options: () =>
            languages.map(language => ({
              label: language.label,
              value: language.id,
            })),
          value: () => activeEditor.editor()?.languageId ?? '',
          set: activeEditor.setLanguageId,
          track: language => getUmami().track('change-language', {language}),
        }),
        choice('select', {
          id: 'editor.theme',
          label: () => t('frame.theme'),
          options: () =>
            loadedThemes().map(theme => ({
              label: theme.properties.label,
              value: theme.id,
            })),
          value: () => editor.state.options.themeId,
          set: theme => dispatchUpdateTheme({theme, updateBackground: false}),
          show: id => {
            const theme = loadedThemes().find(item => item.id === id);
            if (theme) showTheme(theme, false);
          },
        }),
        choice('select', {
          id: 'editor.formatter',
          label: () => t('frame.formatter'),
          visible: () => formatters().length > 0,
          disabled: () => formatters().length === 1,
          options: () =>
            formatters().map(plugin => ({
              label: plugin.name,
              value: plugin.parser,
            })),
          value: () =>
            activeEditor.editor()?.formatter ?? formatters()[0]?.parser ?? '',
          set: activeEditor.setFormatterName,
        }),
        {
          kind: 'toggle',
          id: 'editor.lineNumbers',
          label: () => t('frame.lineNumbers'),
          visible: always,
          value: () => editor.state.options.showLineNumbers,
          ...write(editor.actions.setShowLineNumbers),
        },
        {
          kind: 'number',
          id: 'editor.lineNumberStart',
          label: () => t('frame.lineNumberStart'),
          visible: () => editor.state.options.showLineNumbers,
          value: () => activeEditor.editor()?.lineNumberStart ?? 1,
          set: commit(activeEditor.setLineNumberStart),
          min: appEnvironment.lineNumbers.min,
          max: appEnvironment.lineNumbers.max,
        },
      ],
    },
    {
      id: 'font',
      label: () => t('frame.font'),
      controls: [
        {
          kind: 'custom',
          id: 'font.family',
          label: () => t('frame.font'),
          visible: always,
          Control: () => (
            <FontPicker
              value={editor.computed.selectedFont()?.id}
              onChange={editor.actions.setFontId}
            />
          ),
        },
        choice('select', {
          id: 'font.weight',
          label: () => t('frame.fontWeight'),
          options: () =>
            (editor.computed.selectedFont()?.types ?? []).map(type => ({
              label: type.name,
              value: type.weight,
            })),
          value: () => editor.state.options.fontWeight,
          set: editor.actions.setFontWeight,
        }),
        {
          kind: 'toggle',
          id: 'font.ligatures',
          label: () => t('frame.ligatures'),
          visible: always,
          value: () => editor.state.options.enableLigatures,
          ...write(editor.actions.setEnableLigatures),
        },
      ],
    },
  ];

  const byId = new Map(
    sections.flatMap(section => section.controls).map(c => [c.id, c]),
  );

  return {
    sections,
    control: id => byId.get(id),
    themes,
    preview: session.show,
    endPreview: session.end,
  };
}
