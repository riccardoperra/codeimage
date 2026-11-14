import {getRootEditorStore} from '@codeimage/store/editor';
import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {RadioGroup} from '@kobalte/core/radio-group';
import {TERMINAL_SHADOWS} from '@core/configuration/shadow';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {getUmami} from '@core/constants/umami';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import type {Accessor, Component, ParentProps} from 'solid-js';
import {createSignal, For, Show, Suspense} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {provideState} from 'statebuilder';
import {EditorForm} from '../../../../components/PropertyEditor/EditorForm';
import {PanelHeader} from '../../../../components/PropertyEditor/PanelHeader';
import {
  FullWidthPanelRow,
  PanelRow,
  TwoColumnPanelRow,
} from '../../../../components/PropertyEditor/PanelRow';
import {ColorPickerPopover} from '../../../../components/PropertyEditor/controls/ColorPicker/ColorPicker';
import {FontSystemPicker} from '../../../../components/PropertyEditor/controls/FontPicker/FontSystemPicker';
import {PresetSwitcher} from '../../../../components/Presets/PresetSwitcher/PresetSwitcher';
import type {VariantProps} from '../../contract';
import type {ControlId} from '../../model';
import {ControlRow, ownKeys, renderControl} from './controls';
import type {IconComponent} from './icons';
import {
  CodeIcon,
  FrameIcon,
  PresetsIcon,
  ThemesIcon,
  WindowIcon,
} from './icons';
import * as styles from './studio.css';
import {ThemesPanel} from './ThemesPanel';

export type PanelId = 'themes' | 'frame' | 'window' | 'code' | 'presets';

export interface PanelProps extends VariantProps {
  readonly close: () => void;
  /** Kit control size: larger on touch layouts. */
  readonly size: Accessor<'sm' | 'md'>;
  readonly phone: Accessor<boolean>;
}

export interface Panel {
  readonly id: PanelId;
  readonly label: string;
  readonly Icon: IconComponent;
  /** The theme gallery needs room for three columns of roomy cards. */
  readonly wide?: boolean;
  /** The presets switcher draws its own title row. */
  readonly ownHeader?: boolean;
  /** Phone sheets open at the short stop unless browsing needs the tall one. */
  readonly sheet?: 'tall';
  readonly Body: Component<PanelProps>;
}

function Rows(props: PanelProps & {ids: readonly ControlId[]}) {
  return (
    <For each={props.ids}>
      {id => <ControlRow model={props.model} id={id} size={props.size} />}
    </For>
  );
}

/** Production rows and section titles, with space between groups instead of dividers. */
function Form(props: ParentProps) {
  return (
    <div class={styles.panelBody}>
      <EditorForm>{props.children}</EditorForm>
    </div>
  );
}

function FramePanel(props: PanelProps) {
  const visible = () => props.model.control('frame.visible');
  const background = () => props.model.control('frame.background');
  return (
    <Form>
      <section class={styles.section}>
        <PanelHeader label={background()?.label() ?? 'Background'} />
        <Show when={visible()}>
          {control => renderControl(control(), props.size)}
        </Show>
        <Show when={background()?.visible() && background()}>
          {control => {
            const bg = control();
            return bg.kind === 'background' ? (
              <div class={styles.fullWidth}>
                <ColorPickerPopover
                  value={bg.value()}
                  onChange={bg.set}
                  colors={[...bg.colors]}
                  gradientColors={[...bg.gradients]}
                />
              </div>
            ) : null;
          }}
        </Show>
        <Rows {...props} ids={['frame.opacity']} />
      </section>
      <section class={styles.section}>
        <PanelHeader label="Layout" />
        <Rows
          {...props}
          ids={['frame.padding', 'frame.radius', 'frame.aspectRatio']}
        />
      </section>
    </Form>
  );
}

const windowStyleNames: Record<string, string> = {
  macOs: 'macOS',
  macOsGrayTheme: 'macOS gray',
  macOsOutlineTheme: 'macOS outline',
  windows: 'Windows',
};

/**
 * Today's window picker is a modal over the frame. The panel has room for the
 * choices, so they sit here; the kit's RadioList draws no previews.
 */
function WindowStyleField(props: PanelProps) {
  const terminal = getTerminalState();
  const editor = getRootEditorStore();
  const control = () => props.model.control('window.style');

  return (
    <Show when={control()?.visible()}>
      <FullWidthPanelRow>
        <RadioGroup
          class={styles.windowGrid}
          style={{width: '100%'}}
          aria-label="Window style"
          value={terminal.state.type}
          onChange={type => {
            terminal.setType(type);
            getUmami().track('change-terminal-type', {type});
          }}
          onKeyDown={ownKeys}
        >
          <For each={Object.values(AVAILABLE_TERMINAL_THEMES.entries)}>
            {entry => (
              <RadioGroup.Item value={entry.name} class={styles.windowTile}>
                <RadioGroup.ItemInput />
                <RadioGroup.ItemLabel class={styles.windowTileLabel}>
                  <span class={styles.visuallyHidden}>
                    {windowStyleNames[entry.name] ?? entry.name}
                  </span>
                </RadioGroup.ItemLabel>
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
                <span class={styles.windowTileCaption} aria-hidden="true">
                  {windowStyleNames[entry.name] ?? entry.name}
                </span>
              </RadioGroup.Item>
            )}
          </For>
        </RadioGroup>
      </FullWidthPanelRow>
    </Show>
  );
}

function WindowPanel(props: PanelProps) {
  return (
    <Form>
      <section class={styles.section}>
        <PanelHeader label="Title bar" />
        <Rows {...props} ids={['window.header']} />
        <WindowStyleField {...props} />
        <Rows {...props} ids={['window.accent']} />
      </section>
      <section class={styles.section}>
        <PanelHeader label="Surface" />
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
    </Form>
  );
}

type FontSource = 'web' | 'system';

/**
 * Today's font picker opens beside the panel, over the frame. Here the
 * bundled fonts are a kit select and the system fonts use the production list.
 */
function FontRows(props: PanelProps) {
  const editor = getRootEditorStore();
  const config = provideState(EditorConfigStore);
  const [source, setSource] = createSignal<FontSource>(
    editor.computed.selectedFont()?.type === 'system' ? 'system' : 'web',
  );
  const fontId = () => editor.computed.selectedFont()?.id ?? '';
  const family = () => props.model.control('font.family');

  return (
    <>
      <PanelRow for="studio-font-source" label="Source">
        <TwoColumnPanelRow>
          <SegmentedField<FontSource>
            adapt
            id="studio-font-source"
            size={props.size()}
            value={source()}
            onChange={setSource}
            items={[
              {label: 'Bundled', value: 'web'},
              {label: 'System', value: 'system'},
            ]}
          />
        </TwoColumnPanelRow>
      </PanelRow>
      <Show
        when={source() === 'web'}
        fallback={
          <FullWidthPanelRow>
            <div style={{width: '100%'}}>
              <FontSystemPicker
                value={fontId()}
                onChange={editor.actions.setFontId}
                onEsc={() => setSource('web')}
              />
            </div>
          </FullWidthPanelRow>
        }
      >
        {renderControl(
          {
            kind: 'select',
            id: 'font.family',
            label: () => family()?.label() ?? 'Font',
            visible: () => true,
            disabled: () => false,
            options: () =>
              config.get.fonts.map(font => ({key: font.id, label: font.name})),
            value: fontId,
            set: id => {
              props.model.endPreview();
              editor.actions.setFontId(id);
            },
            preview: id =>
              props.model.preview(() => editor.actions.setFontId(id)),
          },
          props.size,
        )}
      </Show>
    </>
  );
}

function CodePanel(props: PanelProps) {
  return (
    <Form>
      <section class={styles.section}>
        <PanelHeader label="Language" />
        <Rows {...props} ids={['editor.language', 'editor.formatter']} />
        <Rows
          {...props}
          ids={['editor.lineNumbers', 'editor.lineNumberStart']}
        />
      </section>
      <section class={styles.section}>
        <PanelHeader
          label={props.model.control('font.family')?.label() ?? 'Font'}
        />
        <FontRows {...props} />
        <Rows {...props} ids={['font.weight', 'font.ligatures']} />
      </section>
    </Form>
  );
}

function PresetsPanel(props: PanelProps) {
  return (
    <div class={styles.presetsHost}>
      <PresetSwitcher orientation="vertical" onClose={props.close} />
    </div>
  );
}

export const PANELS: readonly Panel[] = [
  {
    id: 'themes',
    label: 'Themes',
    Icon: ThemesIcon,
    wide: true,
    sheet: 'tall',
    Body: ThemesPanel,
  },
  {id: 'frame', label: 'Frame', Icon: FrameIcon, Body: FramePanel},
  {id: 'window', label: 'Window', Icon: WindowIcon, Body: WindowPanel},
  {id: 'code', label: 'Code', Icon: CodeIcon, Body: CodePanel},
  {
    id: 'presets',
    label: 'Presets',
    Icon: PresetsIcon,
    ownHeader: true,
    Body: PresetsPanel,
  },
];
