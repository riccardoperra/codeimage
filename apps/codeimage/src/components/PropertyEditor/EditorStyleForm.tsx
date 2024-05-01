import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {LanguageDefinition} from '@codeimage/config/src/lib/types/language-def';
import {CustomTheme} from '@codeimage/highlight';
import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {dispatchUpdateTheme} from '@codeimage/store/effects/onThemeChange';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {createSelectOptions, NumberField, Select} from '@codeui/kit';
import {appEnvironment} from '@core/configuration';
import {getUmami} from '@core/constants/umami';
import {DynamicSizedContainer} from '@ui/DynamicSizedContainer/DynamicSizedContainer';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import {ParentComponent, Show} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';
import {FontPicker} from './controls/FontPicker/FontPicker';
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
  const {lineNumbers: lineNumbersConfig} = appEnvironment;
  const [t] = useI18n<AppLocaleEntries>();
  const {
    editor,
    setLanguageId,
    formatter,
    setFormatterName,
    setLineNumberStart,
  } = getActiveEditorStore();
  const {
    state,
    actions: {setShowLineNumbers, setFontWeight, setFontId, setEnableLigatures},
    computed: {selectedFont},
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

  const fontWeightByFont = () => {
    const font = selectedFont();
    if (!font) {
      return [];
    }
    return font.types.map(type => ({
      label: type.name,
      value: type.weight,
    }));
  };

  const fontWeightOptions = createSelectOptions(fontWeightByFont, {
    key: 'label',
    valueKey: 'value',
  });

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
                        getUmami().track('change-language', {
                          language: language!,
                        });
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

            <Show
              when={formatter.availableFormatters().length > 0}
              keyed={true}
            >
              {_ => (
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
                            formatter.availableFormatters()[0]?.parser,
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
              )}
            </Show>

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
                    adapt
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

            <Show when={state.options.showLineNumbers}>
              <PanelRow
                for={'frameLineNumberStartField'}
                label={t('frame.lineNumberStart')}
              >
                <TwoColumnPanelRow>
                  <SuspenseEditorItem
                    fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                  >
                    <NumberField
                      size={'xs'}
                      min={lineNumbersConfig.min}
                      max={lineNumbersConfig.max}
                      id={'frameLineNumberStartField'}
                      value={editor().lineNumberStart}
                      ref={el => {
                        // TODO why called two times?
                        if (el) {
                          el.autocomplete = 'off';
                        }
                      }}
                      onChange={setLineNumberStart}
                    />
                  </SuspenseEditorItem>
                </TwoColumnPanelRow>
              </PanelRow>
            </Show>
          </DynamicSizedContainer>

          <PanelDivider />

          <DynamicSizedContainer>
            <PanelHeader label={t('frame.font')} />

            <PanelRow
              for={'fontPicker'}
              label={t('frame.font')}
              feature={'fontPicker'}
            >
              <TwoColumnPanelRow>
                <SuspenseEditorItem
                  fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                >
                  <FontPicker
                    value={selectedFont()?.id}
                    onChange={fontId => setFontId(fontId)}
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
                  <SegmentedField
                    adapt
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
          </DynamicSizedContainer>
        </>
      )}
    </Show>
  );
};
