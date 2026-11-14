import {useI18n} from '@codeimage/locale';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getRootEditorStore} from '@codeimage/store/editor';
import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {dispatchCopyToClipboard} from '@codeimage/store/effects/onCopyToClipboard';
import {toast} from '@codeimage/ui';
import {RadioGroup} from '@kobalte/core/radio-group';
import {TERMINAL_SHADOWS} from '@core/configuration/shadow';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {getUmami} from '@core/constants/umami';
import {createAsyncAction} from '@core/hooks/async-action';
import clsx from 'clsx';
import type {Component} from 'solid-js';
import {createEffect, createSignal, For, Show, Suspense} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {provideState} from 'statebuilder';
import {FontSystemPicker} from '../../../../components/PropertyEditor/controls/FontPicker/FontSystemPicker';
import {PresetSwitcher} from '../../../../components/Presets/PresetSwitcher/PresetSwitcher';
import {useExportSnippet} from '../../../../hooks/export-snippet';
import {ExportExtension, ExportMode} from '../../../../hooks/use-export-image';
import type {AppLocaleEntries} from '../../../../i18n';
import type {VariantProps} from '../../contract';
import type {ChoiceOption, ControlId} from '../../model';
import {
  ControlRow,
  ownKeys,
  RangeRow,
  SegmentedField,
  SelectField,
  SwitchRow,
} from './controls';
import type {IconComponent} from './icons';
import {
  CodeIcon,
  CopyIcon,
  ExportIcon,
  FrameIcon,
  OpenIcon,
  PresetsIcon,
  ShareIcon,
  SparklesIcon,
  ThemesIcon,
  WindowIcon,
} from './icons';
import * as styles from './studio.css';
import {ThemesPanel} from './ThemesPanel';

export type PanelId =
  | 'themes'
  | 'frame'
  | 'window'
  | 'code'
  | 'presets'
  | 'export';

export interface PanelProps extends VariantProps {
  readonly close: () => void;
}

export interface Panel {
  readonly id: PanelId;
  readonly label: string;
  readonly Icon: IconComponent;
  /** The theme gallery needs room for three columns of readable tiles. */
  readonly wide?: boolean;
  /**
   * Under 640px the tab bar holds five items. A panel without a tab opens from
   * the named panel's sheet, and that tab stays lit.
   */
  readonly phone: 'tab' | PanelId;
  /** Phone sheets open at the short stop unless the panel needs the tall one. */
  readonly sheet: 'short' | 'tall';
  /** The presets switcher draws its own title row. */
  readonly ownHeader?: boolean;
  readonly Body: Component<PanelProps>;
}

function Rows(props: PanelProps & {ids: readonly ControlId[]}) {
  return (
    <For each={props.ids}>
      {id => <ControlRow model={props.model} id={id} />}
    </For>
  );
}

function FramePanel(props: PanelProps) {
  const visible = props.model.control('frame.visible');
  const background = props.model.control('frame.background');
  return (
    <div class={styles.panelBody}>
      <section class={styles.section}>
        <Show when={visible?.kind === 'toggle' && visible}>
          {toggle => (
            <SwitchRow
              label={background?.label() ?? toggle().label()}
              checked={toggle().value()}
              onChange={toggle().set}
            />
          )}
        </Show>
        <Rows {...props} ids={['frame.background', 'frame.opacity']} />
      </section>
      <div class={styles.divider} />
      <section class={styles.section}>
        <Rows
          {...props}
          ids={['frame.padding', 'frame.radius', 'frame.aspectRatio']}
        />
      </section>
    </div>
  );
}

const windowStyleNames: Record<string, string> = {
  macOs: 'macOS',
  macOsGrayTheme: 'macOS gray',
  macOsOutlineTheme: 'macOS outline',
  windows: 'Windows',
};

/** Today's window picker opens a modal over the frame; here the choices sit in the panel. */
function WindowStyleField(props: PanelProps) {
  const terminal = getTerminalState();
  const editor = getRootEditorStore();
  const control = () => props.model.control('window.style');

  return (
    <Show when={control()?.visible()}>
      <RadioGroup
        class={styles.stack}
        value={terminal.state.type}
        onChange={type => {
          terminal.setType(type);
          getUmami().track('change-terminal-type', {type});
        }}
        onKeyDown={ownKeys}
      >
        <RadioGroup.Label class={styles.label}>Window style</RadioGroup.Label>
        <div class={styles.windowGrid}>
          <For each={Object.values(AVAILABLE_TERMINAL_THEMES.entries)}>
            {entry => (
              <RadioGroup.Item value={entry.name} class={styles.windowTile}>
                <RadioGroup.ItemInput />
                <RadioGroup.ItemLabel class={styles.windowTileLabel}>
                  <span class={styles.visuallyHidden}>
                    {windowStyleNames[entry.name] ?? entry.name}
                  </span>
                </RadioGroup.ItemLabel>
                <span class={styles.windowTileCaption} aria-hidden="true">
                  {windowStyleNames[entry.name] ?? entry.name}
                </span>
                <div class={styles.windowTilePreview} aria-hidden="true">
                  <Suspense>
                    <Dynamic
                      component={entry.component}
                      lite
                      preview={true}
                      shadow={TERMINAL_SHADOWS.md}
                      showTab={true}
                      textColor={terminal.state.textColor}
                      background={terminal.state.background}
                      accentVisible={terminal.state.accentVisible}
                      readonlyTab={true}
                      showHeader={true}
                      showWatermark={false}
                      alternativeTheme={false}
                      opacity={100}
                      themeId={editor.state.options.themeId}
                      showGlassReflection={false}
                      borderType={null}
                    />
                  </Suspense>
                </div>
              </RadioGroup.Item>
            )}
          </For>
        </div>
      </RadioGroup>
    </Show>
  );
}

function WindowPanel(props: PanelProps) {
  return (
    <div class={styles.panelBody}>
      <section class={styles.section}>
        <Rows {...props} ids={['window.header']} />
        <WindowStyleField {...props} />
        <Rows {...props} ids={['window.accent']} />
      </section>
      <div class={styles.divider} />
      <section class={styles.section}>
        <Rows
          {...props}
          ids={[
            'window.backgroundType',
            'window.reflection',
            'window.watermark',
            'window.border',
            'window.shadow',
          ]}
        />
      </section>
    </div>
  );
}

const fontSources: readonly ChoiceOption[] = [
  {key: 'web', label: 'Bundled'},
  {key: 'system', label: 'System'},
];

/** Today's font picker opens beside the panel, over the frame; here it stays in the panel. */
function FontField(props: PanelProps) {
  const editor = getRootEditorStore();
  const config = provideState(EditorConfigStore);
  const [source, setSource] = createSignal(
    editor.computed.selectedFont()?.type === 'system' ? 'system' : 'web',
  );
  const fontId = () => editor.computed.selectedFont()?.id ?? '';
  const webFonts = () =>
    config.get.fonts.map(font => ({key: font.id, label: font.name}));

  return (
    <div class={styles.stack}>
      <SegmentedField
        label={props.model.control('font.family')?.label() ?? 'Font'}
        options={fontSources}
        value={source()}
        onChange={setSource}
      />
      <Show
        when={source() === 'web'}
        fallback={
          <FontSystemPicker
            value={fontId()}
            onChange={editor.actions.setFontId}
            onEsc={() => setSource('web')}
          />
        }
      >
        <SelectField
          label="Font family"
          stacked
          options={webFonts()}
          value={fontId()}
          onChange={editor.actions.setFontId}
        />
      </Show>
    </div>
  );
}

function CodePanel(props: PanelProps) {
  const [format, {notify: runFormat}] = createAsyncAction(() =>
    props.stage.format(),
  );
  return (
    <div class={styles.panelBody}>
      <section class={styles.section}>
        <Rows {...props} ids={['editor.language', 'editor.formatter']} />
        <button
          type="button"
          class={clsx(styles.button, styles.buttonBlock)}
          disabled={!props.stage.canFormat() || format.loading}
          onClick={() => runFormat()}
        >
          <SparklesIcon size={16} />
          Format code
        </button>
        <Rows
          {...props}
          ids={['editor.lineNumbers', 'editor.lineNumberStart']}
        />
      </section>
      <div class={styles.divider} />
      <section class={styles.section}>
        <FontField {...props} />
        <Rows {...props} ids={['font.weight', 'font.ligatures']} />
      </section>
    </div>
  );
}

function PresetsPanel(props: PanelProps) {
  return (
    <div class={styles.presetsHost}>
      <PresetSwitcher orientation="vertical" onClose={props.close} />
    </div>
  );
}

const formats: readonly ChoiceOption[] = [
  {key: ExportExtension.png, label: 'PNG'},
  {key: ExportExtension.svg, label: 'SVG'},
  {key: ExportExtension.jpeg, label: 'JPEG'},
];

const scales: readonly ChoiceOption[] = [1, 2, 3, 6].map(scale => ({
  key: String(scale),
  label: `${scale}x`,
}));

export const EXPORT_BUTTON_ID = 'studio-export-download';

const SAVE_SHORTCUT = /Mac|iPhone|iPad/.test(navigator.platform)
  ? '⌘S'
  : 'Ctrl+S';

/**
 * One home for export settings: today the toolbar popover writes the store
 * while the dialog keeps its own copy, so the two disagree.
 */
function ExportPanel(props: PanelProps) {
  const [t] = useI18n<AppLocaleEntries>();
  const settings = getExportCanvasStore();
  const [download, notifyDownload] = useExportSnippet();
  const [opened, notifyOpen] = useExportSnippet();
  const [shared, notifyShare] = useExportSnippet();
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;
  const isJpeg = () => settings.get.extension === ExportExtension.jpeg;

  const run = (
    notify: typeof notifyDownload,
    mode: ExportMode.export | ExportMode.newTab | ExportMode.share,
  ) => {
    getUmami().track('export-confirm', {
      mode,
      extension: settings.get.extension,
    });
    notify({
      ref: props.stage.exportRef(),
      options: {
        extension: settings.get.extension,
        mode,
        pixelRatio: settings.get.devicePixelRatio,
        quality: settings.get.jpegQuality / 100,
      },
    });
  };

  createEffect(() => {
    if (download.error || opened.error || shared.error) {
      toast.error(t('export.genericSaveError'), {position: 'bottom-center'});
    }
  });

  return (
    <div class={styles.panelBody}>
      <section class={styles.section}>
        <SegmentedField
          label={t('export.extensionType')}
          options={formats}
          value={settings.get.extension}
          onChange={key => settings.set('extension', key as ExportExtension)}
        />
        <Show when={isJpeg()}>
          <p class={styles.hint}>
            {t('export.noOpacitySupportedWithThisExtension')}
          </p>
          <RangeRow
            label={t('export.quality')}
            value={settings.get.jpegQuality}
            min={70}
            max={100}
            step={2}
            unit="%"
            onChange={value => settings.set('jpegQuality', value)}
          />
        </Show>
        <SegmentedField
          label={t('export.pixelRatio')}
          options={scales}
          value={String(settings.get.devicePixelRatio)}
          onChange={key => settings.set('devicePixelRatio', Number(key))}
        />
        <div class={styles.row}>
          <span class={styles.label}>Output size</span>
          <span class={styles.resolution}>
            {settings.canvasResolution().replace('x', ' × ')} px
          </span>
        </div>
        <SwitchRow
          label="Only the active tab"
          checked={settings.get.showOnlyActiveTab}
          onChange={settings.setShowOnlyActiveTab}
        />
      </section>
      <div class={styles.divider} />
      <section class={styles.section}>
        <button
          id={EXPORT_BUTTON_ID}
          type="button"
          class={clsx(styles.button, styles.buttonPrimary, styles.buttonBlock)}
          disabled={download.loading}
          onClick={() => run(notifyDownload, ExportMode.export)}
        >
          <ExportIcon size={16} />
          {download.loading
            ? 'Exporting…'
            : `Download ${settings.get.extension.toUpperCase()}`}
          <kbd class={styles.kbd}>{SAVE_SHORTCUT}</kbd>
        </button>
        <div class={styles.buttonRow}>
          <CopyButton {...props} />
          <button
            type="button"
            class={styles.button}
            disabled={opened.loading}
            onClick={() => run(notifyOpen, ExportMode.newTab)}
          >
            <OpenIcon size={16} />
            Open in tab
          </button>
        </div>
        <Show when={canShare}>
          <button
            type="button"
            class={clsx(styles.button, styles.buttonBlock)}
            disabled={shared.loading}
            onClick={() => run(notifyShare, ExportMode.share)}
          >
            <ShareIcon size={16} />
            Share…
          </button>
        </Show>
      </section>
    </div>
  );
}

function CopyButton(props: PanelProps) {
  const settings = getExportCanvasStore();
  const supported = () =>
    !!navigator.clipboard?.write &&
    settings.get.extension !== ExportExtension.jpeg;

  return (
    <button
      type="button"
      class={styles.button}
      disabled={!supported() || dispatchCopyToClipboard.loading()}
      title={
        supported()
          ? undefined
          : 'Copy needs the Clipboard API and a PNG or SVG export'
      }
      onClick={() => {
        const ref = props.stage.exportRef();
        if (ref) dispatchCopyToClipboard({ref});
      }}
    >
      <CopyIcon size={16} />
      Copy
    </button>
  );
}

export const PANELS: readonly Panel[] = [
  {
    id: 'themes',
    label: 'Themes',
    Icon: ThemesIcon,
    wide: true,
    phone: 'tab',
    sheet: 'tall',
    Body: ThemesPanel,
  },
  {
    id: 'frame',
    label: 'Frame',
    Icon: FrameIcon,
    phone: 'tab',
    sheet: 'short',
    Body: FramePanel,
  },
  {
    id: 'window',
    label: 'Window',
    Icon: WindowIcon,
    phone: 'tab',
    sheet: 'short',
    Body: WindowPanel,
  },
  {
    id: 'code',
    label: 'Code',
    Icon: CodeIcon,
    phone: 'tab',
    sheet: 'short',
    Body: CodePanel,
  },
  {
    id: 'presets',
    label: 'Presets',
    Icon: PresetsIcon,
    phone: 'themes',
    sheet: 'short',
    ownHeader: true,
    Body: PresetsPanel,
  },
  {
    id: 'export',
    label: 'Export',
    Icon: ExportIcon,
    phone: 'tab',
    sheet: 'short',
    Body: ExportPanel,
  },
];
