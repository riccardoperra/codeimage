import {PanelHeader} from './PanelHeader';
import {PanelRow, TwoColumnPanelRow} from './PanelRow';
import {Select} from '../ui/Select/Select';
import {SegmentedField} from '../ui/SegmentedField/SegmentedField';
import {Text} from '../ui/Text/Text';
import {useI18n} from '@codeimage/locale';
import {locale} from './FrameSidebar.locale';
import {useEditorState} from '../../state/editor';
import {useStaticConfiguration} from '../../core/configuration';

export const EditorStyleForm = () => {
  const editor = useEditorState();
  const configuration = useStaticConfiguration();
  const [t, {merge}] = useI18n<typeof locale>();
  merge(locale);

  return (
    <>
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
    </>
  );
};
