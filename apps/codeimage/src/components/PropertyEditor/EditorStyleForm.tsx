import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {LanguageDefinition} from '@codeimage/config/src/lib/types/language-def';
import {CustomTheme} from '@codeimage/highlight';
import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {dispatchUpdateTheme} from '@codeimage/store/effects/onThemeChange';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {SegmentedField} from '@codeimage/ui';
import {Select} from '@codeui/kit';
import {SUPPORTED_FONTS} from '@core/configuration/font';
import {getUmami} from '@core/constants/umami';
import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import {createMemo, ParentComponent, Show} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';
import {PanelDivider} from './PanelDivider';
import {PanelHeader} from './PanelHeader';
import {PanelRow, TwoColumnPanelRow} from './PanelRow';
import {SuspenseEditorItem} from './SuspenseEditorItem';

const languages: readonly LanguageDefinition[] = [...SUPPORTED_LANGUAGES].sort(
  (a, b) => {
    if (a.featured && !b.featured) {
      return -1; // a comes first
    } else if (!a.featured && b.featured) {
      return 1; // b comes first
    } else if (a.featured && b.featured) {
      return SUPPORTED_LANGUAGES.indexOf(a) - SUPPORTED_LANGUAGES.indexOf(b); // sort by position
    } else {
      return a.label.localeCompare(b.label); // sort alphabetically
    }
  },
);

export const EditorStyleForm: ParentComponent = () => {
  const {themeArray} = getThemeStore();

  const themeItems = () =>
    themeArray()
      .map(theme => theme())
      .filter((theme): theme is CustomTheme => !!theme)
      .map(
        theme =>
          ({
            label: theme.properties.label,
            value: theme.id,
          } as const),
      );

  const fonts = SUPPORTED_FONTS;
  const [t] = useI18n<AppLocaleEntries>();
  const {editor, setLanguageId} = getActiveEditorStore();
  const {
    state,
    actions: {setShowLineNumbers, setFontWeight, setFontId, setEnableLigatures},
    computed: {font},
  } = getRootEditorStore();

  const fontOptions = createMemo(() =>
    fonts.map(font => ({
      label: font.name,
      value: font.id,
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
                  aria-label={'Language'}
                  id={'frameLanguageField'}
                  options={languages.map(({label, id}) => ({
                    label: label,
                    value: id,
                  }))}
                  value={editor.languageId}
                  size={'xs'}
                  optionTextValue={'label'}
                  optionValue={'value'}
                  itemLabel={props => props.label}
                  valueComponent={props => props.item.rawValue.label}
                  onValueChange={language => {
                    setLanguageId(language);
                    getUmami().trackEvent(language, 'change-language');
                  }}
                />
              </SuspenseEditorItem>
            </TwoColumnPanelRow>
          </PanelRow>

          <PanelRow for={'frameLanguageField'} label={t('frame.theme')}>
            <TwoColumnPanelRow>
              <SuspenseEditorItem
                fallback={<SkeletonLine width={'100%'} height={'26px'} />}
              >
                <Select
                  aria-label={'Syntax highlight'}
                  id={'frameSyntaxHighlightField'}
                  options={themeItems()}
                  optionTextValue={'label'}
                  size={'xs'}
                  optionValue={'value'}
                  value={state.options.themeId}
                  itemLabel={props => props.label}
                  valueComponent={props => props.item.rawValue.label}
                  onValueChange={theme => {
                    dispatchUpdateTheme({
                      updateBackground: false,
                      theme,
                    });
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

          <PanelDivider />

          <PanelHeader label={t('frame.font')} />

          <PanelRow for={'frameFontField'} label={t('frame.font')}>
            <TwoColumnPanelRow>
              <SuspenseEditorItem
                fallback={<SkeletonLine width={'100%'} height={'26px'} />}
              >
                <Select
                  aria-label={'Font'}
                  id={'frameFontField'}
                  options={fontOptions()}
                  optionTextValue={'label'}
                  optionValue={'value'}
                  size={'xs'}
                  value={font()?.id}
                  itemLabel={itemLabelProps => (
                    <span
                      style={{
                        'font-family': `${itemLabelProps.label}, monospace`,
                        'font-size': '80%',
                      }}
                    >
                      {itemLabelProps.label}
                    </span>
                  )}
                  valueComponent={props => props.item.rawValue.label}
                  onValueChange={fontId => {
                    console.log('font id', fontId);
                    setFontId(fontId);
                    if (
                      !font()
                        .types.map(type => type.weight as number)
                        .includes(state.options.fontWeight)
                    ) {
                      setFontWeight(font().types[0].weight);
                    }
                  }}
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
                  aria-label={'Font weight'}
                  id={'frameFontWeightField'}
                  options={fontWeightOptions()}
                  size={'xs'}
                  // @ts-expect-error TODO: support number types?
                  value={state.options.fontWeight}
                  optionTextValue={'label'}
                  optionValue={'value'}
                  itemLabel={props => props.label}
                  valueComponent={props => props.item.rawValue.label}
                  onValueChange={value => {
                    const weight = value ? parseInt(value) : 400;
                    setFontWeight(weight);
                  }}
                />
              </SuspenseEditorItem>
            </TwoColumnPanelRow>
          </PanelRow>

          <PanelRow for={'frameFontWeightField'} label={t('frame.ligatures')}>
            <TwoColumnPanelRow>
              <SuspenseEditorItem
                fallback={<SkeletonLine width={'85%'} height={'26px'} />}
              >
                <SegmentedField
                  size={'xs'}
                  id={'frameLigaturesField'}
                  value={state.options.enableLigatures}
                  onChange={setEnableLigatures}
                  items={[
                    {label: t('common.yes'), value: true},
                    {label: t('common.no'), value: false},
                  ]}
                />
              </SuspenseEditorItem>
            </TwoColumnPanelRow>
          </PanelRow>
        </>
      )}
    </Show>
  );
};
