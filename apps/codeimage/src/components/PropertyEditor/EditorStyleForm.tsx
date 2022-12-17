import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {SegmentedField, Select, Text} from '@codeimage/ui';
import {SUPPORTED_FONTS} from '@core/configuration/font';
import {getUmami} from '@core/constants/umami';
import {useModality} from '@core/hooks/isMobile';
import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import {createMemo, ParentComponent, Show} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';
import {PanelHeader} from './PanelHeader';
import {PanelRow, TwoColumnPanelRow} from './PanelRow';
import {SuspenseEditorItem} from './SuspenseEditorItem';

export const EditorStyleForm: ParentComponent = () => {
  const languages = SUPPORTED_LANGUAGES;
  const fonts = SUPPORTED_FONTS;
  const modality = useModality();
  const [t] = useI18n<AppLocaleEntries>();
  const {editor, setLanguageId} = getActiveEditorStore();
  const {
    state,
    actions: {setShowLineNumbers, setFontWeight, setFontId},
    computed: {font},
  } = getRootEditorStore();

  const fontOptions = createMemo(() =>
    fonts.map(font => ({
      label: font.name,
      value: font,
    })),
  );

  const fontWeightOptions = createMemo(() =>
    font().types.map(type => ({
      label: type.name,
      value: type.weight,
    })),
  );

  return (
    <Show when={editor()} keyed>
      {editor => (
        <>
          <PanelHeader label={t('frame.editor')} />

          <PanelRow for={'frameLanguageField'} label={t('frame.language')}>
            <TwoColumnPanelRow>
              <SuspenseEditorItem
                fallback={<SkeletonLine width={'100%'} height={'26px'} />}
              >
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
                    getUmami().trackEvent(language, 'change-language');
                  }}
                />
              </SuspenseEditorItem>
            </TwoColumnPanelRow>
          </PanelRow>

          <PanelRow
            for={'frameLineNumbersField'}
            label={t('frame.lineNumbers')}
          >
            <TwoColumnPanelRow>
              <SuspenseEditorItem
                fallback={<SkeletonLine width={'100%'} height={'26px'} />}
              >
                <SegmentedField
                  size={'xs'}
                  id={'frameLineNumbersField'}
                  value={state.options.showLineNumbers}
                  onChange={setShowLineNumbers}
                  items={[
                    {label: t('common.show'), value: true},
                    {label: t('common.hide'), value: false},
                  ]}
                />
              </SuspenseEditorItem>
            </TwoColumnPanelRow>
          </PanelRow>

          <PanelRow for={'frameFontField'} label={t('frame.font')}>
            <TwoColumnPanelRow>
              <SuspenseEditorItem
                fallback={<SkeletonLine width={'100%'} height={'26px'} />}
              >
                <Select
                  id={'frameFontField'}
                  native={modality === 'mobile'}
                  multiple={false}
                  items={fontOptions()}
                  value={font()}
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
              </SuspenseEditorItem>
            </TwoColumnPanelRow>
          </PanelRow>

          <PanelRow for={'frameFontWeightField'} label={t('frame.fontWeight')}>
            <TwoColumnPanelRow>
              <SuspenseEditorItem
                fallback={<SkeletonLine width={'85%'} height={'26px'} />}
              >
                <Select
                  id={'frameFontWeightField'}
                  native={modality === 'mobile'}
                  multiple={false}
                  items={fontWeightOptions()}
                  value={state.options.fontWeight}
                  onSelectChange={value =>
                    setFontWeight(value ?? font()?.types[0].weight ?? 400)
                  }
                />
              </SuspenseEditorItem>
            </TwoColumnPanelRow>
          </PanelRow>
        </>
      )}
    </Show>
  );
};
