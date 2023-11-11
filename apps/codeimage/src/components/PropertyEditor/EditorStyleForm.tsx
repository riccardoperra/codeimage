import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {LanguageDefinition} from '@codeimage/config/src/lib/types/language-def';
import {CustomTheme} from '@codeimage/highlight';
import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {dispatchUpdateTheme} from '@codeimage/store/effects/onThemeChange';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {
  createSelectOptions,
  SegmentedControl,
  SegmentedControlItem,
  Select,
} from '@codeui/kit';
import {SUPPORTED_FONTS} from '@core/configuration/font';
import {getUmami} from '@core/constants/umami';
import {DynamicSizedContainer} from '@ui/DynamicSizedContainer/DynamicSizedContainer';
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
  const [t] = useI18n<AppLocaleEntries>();
  const {editor, setLanguageId, formatter, setFormatterName} =
    getActiveEditorStore();
  const {
    state,
    actions: {setShowLineNumbers, setFontWeight, setFontId, setEnableLigatures},
    computed: {font},
  } = getRootEditorStore();

  const languagesOptions = createSelectOptions(
    languages.map(language => ({
      label: language.label,
      value: language.id,
    })),
    {
      key: 'label',
      valueKey: 'value',
    },
  );

  const syntaxHighlightOptions = createSelectOptions(
    () =>
      themeArray()
        .map(theme => theme())
        .filter((theme): theme is CustomTheme => !!theme)
        .map(theme => {
          return {
            label: theme.properties.label,
            value: theme.id,
          };
        }),
    {key: 'label', valueKey: 'value'},
  );

  const languageFormatterOptions = createSelectOptions(
    () =>
      formatter.availableFormatters().map(prettierPlugin => {
        return {
          label: prettierPlugin.name,
          value: prettierPlugin.parser,
        };
      }),
    {key: 'label', valueKey: 'value'},
  );

  const memoizedFontWeights = createMemo(() =>
    font().types.map(type => ({
      label: type.name,
      value: type.weight as number,
    })),
  );

  const fontWeightOptions = createSelectOptions(memoizedFontWeights, {
    key: 'label',
    valueKey: 'value',
  });

  const fontOptions = createSelectOptions(
    SUPPORTED_FONTS.map(font => ({
      label: font.name,
      value: font.id,
    })),
    {key: 'label', valueKey: 'value'},
  );

  return (
    <Show when={editor()}>
      {editor => (
        <>
          <DynamicSizedContainer>
            <PanelHeader label={t('frame.editor')} />

            <PanelRow for={'frameLanguageField'} label={t('frame.language')}>
              <TwoColumnPanelRow>
                <SuspenseEditorItem
                  fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                >
                  <Select
                    {...languagesOptions.props()}
                    {...languagesOptions.controlled(
                      () => editor().languageId,
                      language => {
                        setLanguageId(language!);
                        getUmami().trackEvent(language!, 'change-language');
                      },
                    )}
                    options={languagesOptions.options()}
                    aria-label={'Language'}
                    id={'frameLanguageField'}
                    size={'xs'}
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
                    {...syntaxHighlightOptions.props()}
                    {...syntaxHighlightOptions.controlled(
                      () => state.options.themeId,
                      theme => {
                        theme = theme as string;
                        dispatchUpdateTheme({
                          updateBackground: false,
                          theme,
                        });
                      },
                    )}
                    options={syntaxHighlightOptions.options()}
                    aria-label={'Syntax highlight'}
                    id={'frameSyntaxHighlightField'}
                    size={'xs'}
                  />
                </SuspenseEditorItem>
              </TwoColumnPanelRow>
            </PanelRow>

            <Show when={formatter.availableFormatters().length > 0}>
              <PanelRow
                for={'editorLanguageFormatterField'}
                label={t('frame.formatter')}
              >
                <TwoColumnPanelRow>
                  <SuspenseEditorItem
                    fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                  >
                    <Select
                      {...languageFormatterOptions.props()}
                      {...languageFormatterOptions.controlled(
                        () =>
                          editor()?.formatter ??
                          formatter.availableFormatters()[0].parser,
                        formatter => {
                          formatter = formatter as string;
                          setFormatterName(formatter);
                        },
                      )}
                      disabled={formatter.availableFormatters().length === 1}
                      options={languageFormatterOptions.options()}
                      aria-label={'Editor language formatter'}
                      id={'editorLanguageFormatterField'}
                      size={'xs'}
                    />
                  </SuspenseEditorItem>
                </TwoColumnPanelRow>
              </PanelRow>
            </Show>

            <PanelRow
              for={'frameLineNumbersField'}
              label={t('frame.lineNumbers')}
            >
              <TwoColumnPanelRow>
                <SuspenseEditorItem
                  fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                >
                  <SegmentedControl
                    size={'xs'}
                    value={state.options.showLineNumbers ? 'y' : 'n'}
                    onChange={value => setShowLineNumbers(value === 'y')}
                    id={'frameLineNumbersField'}
                    fluid
                    autoWidth
                  >
                    <SegmentedControlItem value={'y'}>
                      {t('common.show')}
                    </SegmentedControlItem>
                    <SegmentedControlItem value={'n'}>
                      {t('common.hide')}
                    </SegmentedControlItem>
                  </SegmentedControl>
                </SuspenseEditorItem>
              </TwoColumnPanelRow>
            </PanelRow>
          </DynamicSizedContainer>

          <PanelDivider />

          <DynamicSizedContainer>
            <PanelHeader label={t('frame.font')} />

            <PanelRow for={'frameFontField'} label={t('frame.font')}>
              <TwoColumnPanelRow>
                <SuspenseEditorItem
                  fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                >
                  <Select
                    options={fontOptions.options()}
                    {...fontOptions.props()}
                    {...fontOptions.controlled(
                      () => font().id,
                      fontId => {
                        setFontId(fontId ?? SUPPORTED_FONTS[0].id);
                        if (
                          !font()
                            .types.map(type => type.weight as number)
                            .includes(state.options.fontWeight)
                        ) {
                          setFontWeight(font().types[0].weight);
                        }
                      },
                    )}
                    aria-label={'Font'}
                    id={'frameFontField'}
                    size={'xs'}
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
                  />
                </SuspenseEditorItem>
              </TwoColumnPanelRow>
            </PanelRow>

            <PanelRow
              for={'frameFontWeightField'}
              label={t('frame.fontWeight')}
            >
              <TwoColumnPanelRow>
                <SuspenseEditorItem
                  fallback={<SkeletonLine width={'85%'} height={'26px'} />}
                >
                  <Select
                    {...fontWeightOptions.props()}
                    {...fontWeightOptions.controlled(
                      () => state.options.fontWeight,
                      value => setFontWeight(value ?? 400),
                    )}
                    aria-label={'Font weight'}
                    id={'frameFontWeightField'}
                    options={fontWeightOptions.options()}
                    size={'xs'}
                  />
                </SuspenseEditorItem>
              </TwoColumnPanelRow>
            </PanelRow>

            <PanelRow for={'frameFontWeightField'} label={t('frame.ligatures')}>
              <TwoColumnPanelRow>
                <SuspenseEditorItem
                  fallback={<SkeletonLine width={'85%'} height={'26px'} />}
                >
                  <SegmentedControl
                    value={state.options.enableLigatures ? 'y' : 'n'}
                    onChange={value => setEnableLigatures(value === 'y')}
                    size={'xs'}
                    fluid
                    autoWidth
                    id={'frameLigaturesField'}
                  >
                    <SegmentedControlItem value={'y'}>
                      {t('common.yes')}
                    </SegmentedControlItem>
                    <SegmentedControlItem value={'n'}>
                      {t('common.no')}
                    </SegmentedControlItem>
                  </SegmentedControl>
                </SuspenseEditorItem>
              </TwoColumnPanelRow>
            </PanelRow>
          </DynamicSizedContainer>
        </>
      )}
    </Show>
  );
};
