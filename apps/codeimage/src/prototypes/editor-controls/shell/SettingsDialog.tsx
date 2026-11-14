import {useI18n} from '@codeimage/locale';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getUiStore} from '@codeimage/store/ui';
import {HStack} from '@codeimage/ui';
import {
  Button,
  buttonStyles,
  Dialog,
  DialogPanelContent,
  DialogPanelFooter,
} from '@codeui/kit';
import {appEnvironment} from '@core/configuration';
import {getUmami} from '@core/constants/umami';
import {createControlledDialog} from '@core/hooks/createControlledDialog';
import {RadioGroup} from '@kobalte/core/radio-group';
import {useNavigate} from '@solidjs/router';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import type {JSX} from 'solid-js';
import {For, Match, Show, Switch} from 'solid-js';
import {Changelog} from '../../../components/Changelog/Changelog';
import type {AppLocaleEntries} from '../../../i18n';
import type {EditorControlsModel, ThemeEntry} from '../model';
import {ThemeSwatch} from '../ThemeSwatch';
import type {ThemeCardsId} from './preferences';
import {LAYOUTS, preferences, THEME_CARDS} from './preferences';
import {LayoutPreview} from './previews';
import {settings} from './settings-state';
import * as styles from './settings.css';

interface CardOption<T extends string> {
  readonly id: T;
  readonly name: string;
  readonly hint: string;
}

/** One choice out of a few, each with a picture of what it gives. */
function ChoiceCards<T extends string>(props: {
  label: string;
  options: readonly CardOption<T>[];
  value: string;
  onChange: (value: T) => void;
  preview: (option: CardOption<T>) => JSX.Element;
}) {
  return (
    <RadioGroup
      class={styles.cards}
      aria-label={props.label}
      value={props.value}
      onChange={value => props.onChange(value as T)}
    >
      <For each={props.options}>
        {option => (
          <RadioGroup.Item value={option.id} class={styles.card}>
            <RadioGroup.ItemInput />
            <RadioGroup.ItemLabel class={styles.cardLabel}>
              <span class={styles.preview} aria-hidden="true">
                {props.preview(option)}
              </span>
              <span class={styles.cardText}>
                <span class={styles.cardName}>{option.name}</span>
                <span class={styles.cardHint}>{option.hint}</span>
              </span>
            </RadioGroup.ItemLabel>
          </RadioGroup.Item>
        )}
      </For>
    </RadioGroup>
  );
}

/** How one theme looks as a card of each style, drawn with the shared swatch. */
function ThemeCardsPreview(props: {style: ThemeCardsId; theme: ThemeEntry}) {
  return (
    <Switch>
      <Match when={props.style === 'window'}>
        <ThemeSwatch
          theme={props.theme}
          variant="window"
          size={48}
          width={68}
        />
      </Match>
      <Match when={props.style === 'orb'}>
        <ThemeSwatch theme={props.theme} variant="syntax-orb" size={44} />
      </Match>
      <Match when={props.style === 'aa'}>
        <span class={styles.listRow}>
          <ThemeSwatch theme={props.theme} variant="aa" size={28} />
          <span class={styles.listLine} />
        </span>
      </Match>
    </Switch>
  );
}

function Section(props: {title: string; hint?: string; children: JSX.Element}) {
  return (
    <section class={styles.section}>
      <div>
        <h3 class={styles.sectionTitle}>{props.title}</h3>
        <Show when={props.hint}>
          <p class={styles.sectionHint}>{props.hint}</p>
        </Show>
      </div>
      {props.children}
    </section>
  );
}

/**
 * The settings of the editor, in one dialog that the header and the command
 * menu open. The workspace comes first: the layout, the side of the
 * Inspector, and how themes are shown. Under it are today's settings, the
 * app's colour mode and its language, and what the old menu at the top left
 * held beside Settings: the changelog, the repository and log out.
 */
export function SettingsDialog(props: {model: EditorControlsModel}) {
  const [t] = useI18n<AppLocaleEntries>();
  const ui = getUiStore();
  const auth = getAuth0State();
  const navigate = useNavigate();
  const openDialog = createControlledDialog();

  // The applied theme, or the first one, as the canvas draws it.
  const theme = () => {
    const themes = props.model.themes();
    return themes.find(entry => entry.active()) ?? themes[0];
  };

  return (
    <Dialog
      size={'lg'}
      title={'Settings'}
      open={settings.isOpen()}
      onOpenChange={open => {
        if (!open) settings.close();
      }}
    >
      <DialogPanelContent>
        <div class={styles.content} data-settings>
          <Section
            title="Layout"
            hint="Where the controls sit around the canvas."
          >
            <ChoiceCards
              label="Layout"
              options={LAYOUTS}
              value={preferences.layout()}
              onChange={preferences.setLayout}
              preview={option => (
                <LayoutPreview
                  layout={option.id}
                  side={preferences.inspectorSide()}
                />
              )}
            />
            <Show when={preferences.layout() === 'inspector'}>
              <div class={styles.row}>
                <span class={styles.rowLabel}>Panel side</span>
                <div class={styles.segmentedNarrow}>
                  <SegmentedField
                    adapt
                    size={'sm'}
                    value={preferences.inspectorSide()}
                    onChange={preferences.setInspectorSide}
                    items={[
                      {label: 'Left', value: 'left'},
                      {label: 'Right', value: 'right'},
                    ]}
                  />
                </div>
              </div>
            </Show>
          </Section>

          <Section
            title="Theme cards"
            hint="How the theme picker shows a theme."
          >
            <Show when={theme()}>
              {current => (
                <ChoiceCards
                  label="Theme cards"
                  options={THEME_CARDS}
                  value={preferences.themeCards()}
                  onChange={preferences.setThemeCards}
                  preview={option => (
                    <ThemeCardsPreview style={option.id} theme={current()} />
                  )}
                />
              )}
            </Show>
          </Section>

          <Section title="Appearance">
            <div class={styles.row}>
              <span class={styles.rowLabel}>Colour mode</span>
              <div class={styles.segmented}>
                <SegmentedField
                  adapt
                  size={'sm'}
                  value={ui.get.themeMode}
                  onChange={ui.setThemeMode}
                  items={[
                    {label: 'Dark', value: 'dark'},
                    {label: 'Light', value: 'light'},
                    {label: 'System', value: 'system'},
                  ]}
                />
              </div>
            </div>
            <div class={styles.row}>
              <span class={styles.rowLabel}>Language</span>
              <div class={styles.segmented}>
                <SegmentedField
                  adapt
                  size={'sm'}
                  value={ui.get.locale}
                  onChange={locale => {
                    ui.setLocale(locale);
                    getUmami().track('change-app-language', {locale});
                  }}
                  items={appEnvironment.locales.map(locale => ({
                    label: t(`locales.${locale}`),
                    value: locale,
                  }))}
                />
              </div>
            </div>
          </Section>

          <Section title="About">
            <div class={styles.links}>
              <Button
                size={'sm'}
                theme={'secondary'}
                onClick={() => {
                  settings.close();
                  openDialog(Changelog, {});
                }}
              >
                Changelog
              </Button>
              <a
                class={buttonStyles.button({theme: 'secondary', size: 'sm'})}
                style={{'text-decoration': 'unset'}}
                target="_blank"
                rel="noreferrer"
                href="https://github.com/riccardoperra/codeimage"
              >
                GitHub
              </a>
              <Show when={auth.loggedIn()}>
                <Button
                  size={'sm'}
                  theme={'secondary'}
                  onClick={() => {
                    settings.close();
                    void auth.signOut().then(() => navigate('/'));
                  }}
                >
                  Logout
                </Button>
              </Show>
              <span class={styles.version}>
                CodeImage {appEnvironment.version}
              </span>
            </div>
          </Section>
        </div>
      </DialogPanelContent>
      <DialogPanelFooter>
        <HStack spacing={'2'} justifyContent={'flexEnd'}>
          <Button
            size={'md'}
            type="button"
            theme={'secondary'}
            onClick={settings.close}
          >
            {t('common.close')}
          </Button>
        </HStack>
      </DialogPanelFooter>
    </Dialog>
  );
}
