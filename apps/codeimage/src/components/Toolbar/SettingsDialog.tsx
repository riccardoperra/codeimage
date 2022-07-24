import {useI18n} from '@codeimage/locale';
import {setLocale, setThemeMode, uiStore} from '@codeimage/store/ui';
import {
  Box,
  Button,
  Dialog,
  DialogPanelContent,
  DialogPanelFooter,
  FieldLabel,
  FlexField,
  Group,
  HStack,
  RadioBlock,
  SegmentedField,
  SegmentedFieldItem,
  SvgIcon,
  Text,
  themeVars,
  VStack,
} from '@codeimage/ui';
import {appEnvironment} from '@core/configuration';
import {For} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';

export function SettingsDialog(props) {
  const ui = uiStore;
  const [, {tUnsafe}] = useI18n<AppLocaleEntries>();
  const {locales} = appEnvironment;

  const localesItems = (): SegmentedFieldItem<string>[] =>
    locales.map(locale => ({
      label: tUnsafe(`locales.${locale}`),
      value: locale,
    }));

  const [t] = useI18n<AppLocaleEntries>();

  return (
    <Dialog size={'xl'} isOpen title={'Settings'} {...props}>
      <DialogPanelContent>
        <Box display={'flex'}>
          <Box style={{width: '25%'}}>
            <FieldLabel>General</FieldLabel>
          </Box>
          <VStack spacing={'8'} flexGrow={1}>
            <FlexField>
              <FieldLabel size={'sm'} for={'theme'}>
                Theme
              </FieldLabel>
              <Group orientation={'horizontal'}>
                <RadioBlock
                  value={'dark'}
                  selected={ui.themeMode === 'dark'}
                  onSelect={setThemeMode}
                >
                  <Box
                    display={'flex'}
                    padding={4}
                    alignItems={'center'}
                    justifyContent={'spaceBetween'}
                  >
                    <Text>Dark mode</Text>
                    <div>
                      <SvgIcon
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill={themeVars.backgroundColor.blue['700']}
                      >
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </SvgIcon>
                    </div>
                  </Box>
                </RadioBlock>
                <RadioBlock
                  value={'light'}
                  selected={ui.themeMode === 'light'}
                  onSelect={setThemeMode}
                >
                  <Box
                    display={'flex'}
                    padding={4}
                    alignItems={'center'}
                    justifyContent={'spaceBetween'}
                  >
                    <Text>Light mode</Text>
                    <div>
                      <SvgIcon
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill={themeVars.backgroundColor.yellow['400']}
                      >
                        <path
                          fill-rule="evenodd"
                          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                          clip-rule="evenodd"
                        />
                      </SvgIcon>
                    </div>
                  </Box>
                </RadioBlock>
              </Group>
            </FlexField>
            <FlexField size={'lg'}>
              <FieldLabel size={'sm'} for={'locale'}>
                Locale
              </FieldLabel>
              <Group orientation={'vertical'}>
                <For each={locales}>
                  {locale => (
                    <RadioBlock
                      selected={locale === ui.locale}
                      onSelect={() => {
                        setLocale(locale);
                        umami.trackEvent(locale, `change-app-language`);
                      }}
                      value={locale}
                    >
                      <Box
                        display={'flex'}
                        paddingLeft={4}
                        height={'100%'}
                        alignItems={'center'}
                        justifyContent={'spaceBetween'}
                      >
                        {tUnsafe(`locales.${locale}`)}
                      </Box>
                    </RadioBlock>
                  )}
                </For>
              </Group>
            </FlexField>
          </VStack>
        </Box>
      </DialogPanelContent>
      <DialogPanelFooter>
        <HStack spacing={'2'} justifyContent={'flexEnd'}>
          <Button
            size={'md'}
            type="button"
            variant={'solid'}
            theme={'secondary'}
            onClick={() => props.onClose?.()}
          >
            {t('common.close')}
          </Button>
        </HStack>
      </DialogPanelFooter>
    </Dialog>
  );
}
