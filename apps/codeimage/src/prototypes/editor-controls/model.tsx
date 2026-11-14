import {
  AVAILABLE_COLORS,
  AVAILABLE_GRADIENTS,
  DEFAULT_ASPECT_RATIOS,
  SUPPORTED_LANGUAGES,
} from '@codeimage/config';
import type {CustomTheme} from '@codeimage/highlight';
import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {dispatchUpdateTheme} from '@codeimage/store/effects/onThemeChange';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {VersionStore} from '@codeimage/store/version/version.store';
import {appEnvironment} from '@core/configuration';
import {shadowsLabel} from '@core/configuration/shadow';
import {getUmami} from '@core/constants/umami';
import type {Accessor, Component} from 'solid-js';
import {createMemo, createSelector} from 'solid-js';
import {provideState} from 'statebuilder';
import {FontPicker} from '../../components/PropertyEditor/controls/FontPicker/FontPicker';
import {ImagePicker} from '../../components/PropertyEditor/controls/ImagePicker/ImagePicker';
import {TerminalControlField} from '../../components/PropertyEditor/controls/TerminalControlField/TerminalControlField';
import type {AppLocaleEntries} from '../../i18n';

export type SectionId = 'frame' | 'window' | 'editor' | 'font';

export type ControlId =
  | 'frame.padding'
  | 'frame.radius'
  | 'frame.visible'
  | 'frame.opacity'
  | 'frame.background'
  | 'frame.backgroundImage'
  | 'frame.aspectRatio'
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
  readonly disabled: Accessor<boolean>;
}

export type SegmentedControl = ChoiceControl<'segmented'>;
export type SelectControl = ChoiceControl<'select'>;

export interface RangeControl extends ControlBase<'range'> {
  readonly value: Accessor<number>;
  readonly set: (value: number) => void;
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
}

/** Renders the production control as is, already bound to the store. */
export interface CustomControl extends ControlBase<'custom'> {
  readonly Control: Component;
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
  };
  readonly active: Accessor<boolean>;
  /** Same as clicking a theme card today: also replaces the frame background. */
  readonly apply: () => void;
}

export interface EditorControlsModel {
  readonly sections: readonly Section[];
  readonly control: (id: ControlId) => Control | undefined;
  /** Registry order. Grows while theme modules load. */
  readonly themes: Accessor<readonly ThemeEntry[]>;
}

type OptionValue = string | number | boolean | null;

interface ChoiceSpec<T extends OptionValue> {
  readonly id: ControlId;
  readonly label: Accessor<string>;
  readonly options: Accessor<readonly {label: string; value: T}[]>;
  readonly value: Accessor<T>;
  readonly set: (value: T) => void;
  readonly visible?: Accessor<boolean>;
  readonly disabled?: Accessor<boolean>;
}

const always = () => true;
const never = () => false;

function choice<K extends 'segmented' | 'select', T extends OptionValue>(
  kind: K,
  spec: ChoiceSpec<T>,
): ChoiceControl<K> {
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
      const option = spec
        .options()
        .find(option => String(option.value) === key);
      if (option) spec.set(option.value);
    },
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
  const versionStore = provideState(VersionStore);
  const shadows = createMemo(shadowsLabel);
  const isActiveTheme = createSelector(() => editor.state.options.themeId);

  // Reading a resource before it is ready would suspend the caller's
  // boundary, so only settled themes are read.
  const loadedThemes = createMemo(() =>
    themeStore.themeArray().flatMap((resource): CustomTheme[] => {
      const theme = resource.state === 'ready' ? resource() : undefined;
      return theme ? [theme] : [];
    }),
  );

  const themes = createMemo(() =>
    loadedThemes().map(
      (theme): ThemeEntry => ({
        id: theme.id,
        name: theme.properties.label,
        dark: theme.properties.darkMode,
        colors: {
          background: theme.properties.previewBackground,
          window: theme.properties.terminal.main,
          text: theme.properties.terminal.text,
        },
        active: () => isActiveTheme(theme.id),
        apply: () => {
          dispatchUpdateTheme({theme, updateBackground: true});
          getUmami().track('theme-change', {themeId: theme.id});
        },
      }),
    ),
  );

  const frameVisible = () => frame.store.visible;
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
          set: frame.setVisibility,
        },
        {
          kind: 'range',
          id: 'frame.opacity',
          label: () => t('frame.opacity'),
          visible: frameVisible,
          value: () => frame.store.opacity,
          set: frame.setOpacity,
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
          set: frame.setBackground,
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
            {label: 'Auto', value: null},
            ...DEFAULT_ASPECT_RATIOS.map(ratio => ({
              label: ratio.name,
              value: ratio.ratio,
            })),
          ],
          value: () => frame.store.aspectRatio,
          set: ratio => {
            frame.setAspectRatio(ratio);
            getUmami().track('aspect-ratio', {ratio: ratio ?? 'unset'});
          },
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
          set: terminal.setShowHeader,
        },
        {
          kind: 'custom',
          id: 'window.style',
          label: () => t('frame.terminal'),
          visible: headerVisible,
          Control: () => (
            <TerminalControlField
              showAccent={terminal.state.accentVisible}
              selectedTerminal={terminal.state.type}
              onTerminalChange={type => {
                terminal.setType(type);
                getUmami().track('change-terminal-type', {type});
              }}
              onShowAccentChange={terminal.setAccentVisible}
            />
          ),
        },
        {
          kind: 'toggle',
          id: 'window.accent',
          label: () => t('frame.tabAccent'),
          visible: headerVisible,
          value: () => terminal.state.accentVisible,
          set: terminal.setAccentVisible,
        },
        {
          kind: 'toggle',
          id: 'window.reflection',
          label: () => t('frame.reflection'),
          visible: always,
          value: () => terminal.state.showGlassReflection,
          set: terminal.setShowGlassReflection,
        },
        {
          kind: 'toggle',
          id: 'window.watermark',
          label: () => t('frame.watermark'),
          visible: always,
          value: () => terminal.state.showWatermark,
          set: terminal.setShowWatermark,
        },
        choice<'select', string | null>('select', {
          id: 'window.shadow',
          label: () => t('frame.shadow'),
          options: shadows,
          value: () => terminal.state.shadow,
          set: shadow => {
            getUmami().track('change-shadow', {shadow: shadow ?? 'none'});
            terminal.setShadow(shadow);
          },
        }),
        choice('select', {
          id: 'window.border',
          label: () => t('frame.border'),
          options: () => [
            {label: 'None', value: 'none'},
            {label: 'Glass', value: 'glass'},
          ],
          value: () => terminal.state.borderType ?? 'none',
          set: border => {
            versionStore.see('borderType', false);
            getUmami().track('change-border', {border});
            terminal.setBorder(border === 'none' ? null : border);
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
          set: language => {
            activeEditor.setLanguageId(language);
            getUmami().track('change-language', {language});
          },
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
          set: editor.actions.setShowLineNumbers,
        },
        {
          kind: 'number',
          id: 'editor.lineNumberStart',
          label: () => t('frame.lineNumberStart'),
          visible: () => editor.state.options.showLineNumbers,
          value: () => activeEditor.editor()?.lineNumberStart ?? 1,
          set: activeEditor.setLineNumberStart,
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
          set: editor.actions.setEnableLigatures,
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
  };
}
