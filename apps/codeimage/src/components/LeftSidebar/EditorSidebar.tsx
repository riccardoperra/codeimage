import * as styles from './EditorSidebar.css';
import {Text} from '../ui/Text/Text';
import {RangeField} from '../ui/RangeField/RangeField';
import {Show} from 'solid-js';
import {SegmentedField} from '../ui/SegmentedField/SegmentedField';
import {ColorPicker} from '../ui/ColorPicker/ColorPicker';
import {useFrameState} from '../../state/frame';
import {useTerminalState} from '../../state/terminal';
import {TerminalControlField} from '../TerminalControlField/TerminalControlField';
import {useI18n} from '@codeimage/locale';
import {locale} from './FrameSidebar.locale';
import {Select} from '../ui/Select/Select';
import {useEditorState} from '../../state/editor';
import {useStaticConfiguration} from '../../core/configuration';
import {PanelHeader} from './PanelHeader';
import {FullWidthPanelRow, PanelRow, TwoColumnPanelRow} from './PanelRow';

export const EditorSidebar = () => {
  const frame = useFrameState();
  const terminal = useTerminalState();
  const editor = useEditorState();
  const configuration = useStaticConfiguration();
  const [t, {merge}] = useI18n<typeof locale>();
  merge(locale);

  return (
    <div class={styles.sidebar}>
      <PanelHeader label={t('frame.frame')} />

      <PanelRow label={t('frame.padding')}>
        <TwoColumnPanelRow>
          <SegmentedField
            size={'xs'}
            value={frame.padding}
            onChange={frame.setPadding}
            items={[
              {label: '16', value: 16},
              {label: '32', value: 32},
              {label: '64', value: 64},
              {label: '128', value: 128},
            ]}
          />
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow label={t('frame.visible')}>
        <TwoColumnPanelRow>
          <SegmentedField
            size={'xs'}
            value={frame.visible}
            onChange={frame.setVisibility}
            items={[
              {label: 'Yes', value: true},
              {label: 'No', value: false},
            ]}
          />
        </TwoColumnPanelRow>
      </PanelRow>

      <Show when={frame.visible}>
        <PanelRow label={t('frame.opacity')}>
          <TwoColumnPanelRow>
            <RangeField
              value={frame.opacity}
              min={0}
              disabled={!frame.visible}
              max={100}
              onChange={frame.setOpacity}
            />
          </TwoColumnPanelRow>
        </PanelRow>
      </Show>

      <Show when={frame.visible}>
        <PanelRow label={t('frame.color')}>
          <TwoColumnPanelRow>
            <ColorPicker
              onChange={frame.setBackground}
              value={frame.background ?? undefined}
            />
          </TwoColumnPanelRow>
        </PanelRow>
      </Show>

      <PanelHeader label={t('frame.terminal')} />

      <PanelRow label={t('frame.header')}>
        <TwoColumnPanelRow>
          <SegmentedField
            size={'xs'}
            value={terminal.showHeader}
            onChange={terminal.setShowHeader}
            items={[
              {label: 'Yes', value: true},
              {label: 'No', value: false},
            ]}
          />
        </TwoColumnPanelRow>
      </PanelRow>

      <Show when={terminal.showHeader}>
        <PanelRow>
          <FullWidthPanelRow>
            <TerminalControlField
              selectedTerminal={terminal.type}
              onTerminalChange={terminal.setType}
            />
          </FullWidthPanelRow>
        </PanelRow>
      </Show>

      <Show when={terminal.showHeader}>
        <PanelRow label={t('frame.tabAccent')}>
          <TwoColumnPanelRow>
            <SegmentedField
              size={'xs'}
              value={terminal.accentVisible}
              onChange={terminal.setAccentVisible}
              items={[
                {label: 'Yes', value: true},
                {label: 'No', value: false},
              ]}
            />
          </TwoColumnPanelRow>
        </PanelRow>
      </Show>

      {/*// TODO: to refactor: handle light/dark mode, handle mobile view, add customizable shadows */}
      {/*<PanelRow label={t('frame.shadows')}>*/}
      {/*  <TwoColumnPanelRow>*/}
      {/*    <ShadowField value={terminal.shadow} onChange={terminal.setShadow} />*/}
      {/*  </TwoColumnPanelRow>*/}
      {/*</PanelRow>*/}

      <PanelHeader label={t('frame.editor')} />

      <PanelRow label={t('frame.language')}>
        <TwoColumnPanelRow>
          <Select
            multiple={false}
            items={configuration.languages.map(({label, id}) => ({
              label: label,
              value: id,
            }))}
            value={editor.languageId}
            onSelectChange={value =>
              editor.setLanguageId(value ?? configuration.languages[0].id)
            }
          />
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow label={t('frame.lineNumbers')}>
        <TwoColumnPanelRow>
          <SegmentedField
            size={'xs'}
            value={editor.showLineNumbers}
            onChange={editor.setShowLineNumbers}
            items={[
              {label: 'Show', value: true},
              {label: 'Hide', value: false},
            ]}
          />
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow label={t('frame.font')}>
        <TwoColumnPanelRow>
          <Select
            multiple={false}
            items={configuration.fonts.map(font => ({
              label: font.name,
              value: font,
            }))}
            value={configuration.fonts.find(font => font.id === editor.fontId)}
            itemContent={({label, value, selected}) => (
              <Text
                size={'xs'}
                display={'block'}
                weight={selected ? 'medium' : 'normal'}
                style={{'font-family': `${value.name}, monospace`}}
              >
                {label}
              </Text>
            )}
            onSelectChange={value =>
              editor.setFontId(value?.id ?? configuration.fonts[0].id)
            }
          />
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow label={t('frame.fontWeight')}>
        <TwoColumnPanelRow>
          <Select
            multiple={false}
            items={
              editor.getFont()?.types.map(type => ({
                label: type.name,
                value: type.weight,
              })) || []
            }
            value={editor.fontWeight}
            onSelectChange={value =>
              editor.setFontWeight(
                value ?? editor.getFont()?.types[0].weight ?? 400,
              )
            }
          />
        </TwoColumnPanelRow>
      </PanelRow>
    </div>
  );
};
