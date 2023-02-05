import {useI18n} from '@codeimage/locale';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getUiStore} from '@codeimage/store/ui';
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
  RadioField,
  RadioGroupField,
  sprinkles,
  SvgIcon,
  Text,
  themeVars,
  VStack,
} from '@codeimage/ui';
import {appEnvironment} from '@core/configuration';
import {getUmami} from '@core/constants/umami';
import {useModality} from '@core/hooks/isMobile';
import {createSignal, For, Match, ParentProps, Switch} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';
import * as styles from './SettingsDialog.css';

export function SettingsDialog(props: ParentProps<{onClose?: () => void}>) {
  const [page] = createSignal<'general' | 'account'>('general');
  const {user, loggedIn} = getAuth0State();
  const ui = getUiStore();
  const {locales} = appEnvironment;
  const modality = useModality();

  const [t] = useI18n<AppLocaleEntries>();

  return (
    <Dialog size={'lg'} isOpen title={'Settings'} {...props}>
      <DialogPanelContent>
        <Box display={'flex'}>
          <div class={styles.dialogContent}>
            <Switch>
              <Match when={page() === 'general'}>
                <VStack spacing={'8'} flexGrow={1}>
                  <FlexField>
                    <FieldLabel size={'sm'} for={'theme'}>
                      Theme
                    </FieldLabel>
                    <Group
                      orientation={
                        modality === 'full' ? 'horizontal' : 'vertical'
                      }
                    >
                      <RadioBlock
                        value={'dark'}
                        selected={ui.get.themeMode === 'dark'}
                        onSelect={ui.setThemeMode}
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
                        selected={ui.get.themeMode === 'light'}
                        onSelect={ui.setThemeMode}
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
                      <RadioBlock
                        value={'system'}
                        selected={ui.get.themeMode === 'system'}
                        onSelect={ui.setThemeMode}
                      >
                        <Box
                          display={'flex'}
                          padding={4}
                          alignItems={'center'}
                          justifyContent={'spaceBetween'}
                        >
                          <Text>System</Text>
                          <div>
                            <SvgIcon viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fill-rule="evenodd"
                                d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z"
                                clip-rule="evenodd"
                              />
                            </SvgIcon>
                          </div>
                        </Box>
                      </RadioBlock>
                    </Group>
                  </FlexField>
                  <FlexField size={'lg'}>
                    <RadioGroupField
                      orientation={'vertical'}
                      value={ui.get.locale}
                      name={'language-field'}
                      label={'Locale'}
                      onChange={locale => {
                        ui.setLocale(locale);
                        getUmami().trackEvent(locale, `change-app-language`);
                      }}
                    >
                      <For each={locales}>
                        {locale => (
                          <RadioField value={locale}>
                            <Box paddingLeft={2}>
                              <Text size={'sm'}>{t(`locales.${locale}`)}</Text>
                            </Box>
                          </RadioField>
                        )}
                      </For>
                    </RadioGroupField>
                  </FlexField>
                </VStack>
              </Match>
              <Match when={page() === 'account' && loggedIn()}>
                <VStack spacing={'8'} flexGrow={1}>
                  <Box
                    display={'flex'}
                    flexDirection={'column'}
                    alignItems={'center'}
                    justifyContent={'center'}
                  >
                    <img
                      class={sprinkles({
                        borderRadius: 'full',
                      })}
                      width={72}
                      height={72}
                      src={user()?.picture}
                    />

                    <VStack spacing={'3'} marginTop={6} alignItems={'center'}>
                      <Text size={'lg'}>
                        {user()?.name} ({user()?.nickname})
                      </Text>
                      <Text size={'xs'} weight={'normal'}>
                        {user()?.email}
                      </Text>
                    </VStack>
                  </Box>

                  <VStack spacing={'4'} marginTop={6} marginBottom={0}>
                    <div>
                      <Button
                        variant={'solid'}
                        theme={'danger'}
                        size={'md'}
                        block
                      >
                        Delete your account
                      </Button>
                    </div>
                    <Text size={'sm'}>
                      *Once your account is deleted, you will lose all persisted
                      data, including your saved projects.
                    </Text>
                  </VStack>
                </VStack>
              </Match>
            </Switch>
          </div>
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
