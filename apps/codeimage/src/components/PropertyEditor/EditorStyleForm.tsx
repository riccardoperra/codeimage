import {PanelHeader} from './PanelHeader';
import {PanelRow, TwoColumnPanelRow} from './PanelRow';
import {SegmentedField, Select, Text} from '@codeimage/ui';
import {useI18n} from '@codeimage/locale';
import {
  editor$,
  font$,
  setFontId,
  setFontWeight,
  setLanguageId,
  setShowLineNumbers,
} from '@codeimage/store/editor';
import {appEnvironment} from '../../core/configuration';
import {useModality} from '../../core/hooks/isMobile';
import {fromObservableObject} from '../../core/hooks/from-observable-object';
import {from} from 'solid-js';
import {map} from 'rxjs';
import {AppLocaleEntries} from '../../i18n';

export const EditorStyleForm = () => {
  const {languages, fonts} = appEnvironment;
  const editor = fromObservableObject(editor$);
  const modality = useModality();
  const [t] = useI18n<AppLocaleEntries>();

  const font = from(font$);

  const fontWeightOptions = from(
    font$.pipe(
      map(font => font?.types || []),
      map(types =>
        types.map(type => ({
          label: type.name,
          value: type.weight,
        })),
      ),
    ),
  );

  return (
    <>
      <PanelHeader label={t('frame.editor')} />

      <PanelRow for={'frameLanguageField'} label={t('frame.language')}>
        <TwoColumnPanelRow>
          <Select
            id={'frameLanguageField'}
            multiple={false}
            native={modality === 'mobile'}
            items={languages.map(({label, id}) => ({
              label: label,
              value: id,
            }))}
            value={editor.languageId}
            onSelectChange={value => {
              const language = value ?? languages[0].id;
              setLanguageId(language);
              umami.trackEvent(language, 'change-language');
            }}
          />
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow for={'frameLineNumbersField'} label={t('frame.lineNumbers')}>
        <TwoColumnPanelRow>
          <SegmentedField
            size={'xs'}
            id={'frameLineNumbersField'}
            value={editor.showLineNumbers}
            onChange={setShowLineNumbers}
            items={[
              {label: t('common.show'), value: true},
              {label: t('common.hide'), value: false},
            ]}
          />
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow for={'frameFontField'} label={t('frame.font')}>
        <TwoColumnPanelRow>
          <Select
            id={'frameFontField'}
            native={modality === 'mobile'}
            multiple={false}
            items={fonts.map(font => ({
              label: font.name,
              value: font,
            }))}
            value={fonts.find(font => font.id === editor.fontId)}
            itemContent={({label, value, selected}) => (
              <Text
                size={'xs'}
                weight={selected ? 'medium' : 'normal'}
                style={{'font-family': `${value.name}, monospace`}}
              >
                {label}
              </Text>
            )}
            onSelectChange={value => setFontId(value?.id ?? fonts[0].id)}
          />
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow for={'frameFontWeightField'} label={t('frame.fontWeight')}>
        <TwoColumnPanelRow>
          <Select
            id={'frameFontWeightField'}
            native={modality === 'mobile'}
            multiple={false}
            items={fontWeightOptions()}
            value={editor.fontWeight}
            onSelectChange={value =>
              setFontWeight(value ?? font()?.types[0].weight ?? 400)
            }
          />
        </TwoColumnPanelRow>
      </PanelRow>
    </>
  );
};
