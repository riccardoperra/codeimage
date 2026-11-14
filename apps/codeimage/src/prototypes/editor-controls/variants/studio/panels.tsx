import {getRootEditorStore} from '@codeimage/store/editor';
import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import type {Accessor, Component, ParentProps} from 'solid-js';
import {createSignal, For, Show} from 'solid-js';
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
import {ControlRow} from '../../controls/ControlRow';
import type {Control, ControlId} from '../../model';
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

function Row(props: {control: Control; size: Accessor<'sm' | 'md'>}) {
  return (
    <ControlRow control={props.control} prefix="studio" size={props.size()} />
  );
}

function Rows(props: PanelProps & {ids: readonly ControlId[]}) {
  return (
    <For each={props.ids}>
      {id => (
        <Show when={props.model.control(id)}>
          {control => <Row control={control()} size={props.size} />}
        </Show>
      )}
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
          {control => <Row control={control()} size={props.size} />}
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

function WindowPanel(props: PanelProps) {
  return (
    <Form>
      <section class={styles.section}>
        <PanelHeader label="Title bar" />
        <Rows
          {...props}
          ids={['window.header', 'window.style', 'window.accent']}
        />
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
        <Row
          size={props.size}
          control={{
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
          }}
        />
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
