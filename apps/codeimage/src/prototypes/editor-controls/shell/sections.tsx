import {useI18n} from '@codeimage/locale';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getUiStore} from '@codeimage/store/ui';
import {Button, buttonStyles} from '@codeui/kit';
import {appEnvironment} from '@core/configuration';
import {getUmami} from '@core/constants/umami';
import {RadioGroup} from '@kobalte/core/radio-group';
import {useNavigate} from '@solidjs/router';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import type {Component, JSX} from 'solid-js';
import {createMemo, For, Match, Show, Switch} from 'solid-js';
import {releaseDate} from '../../../components/WhatsNew/releaseDate';
import {getWhatsNew, RELEASES} from '../../../state/whats-new';
import type {HighlightId, LocatedHighlightId} from '../../../state/whats-new';
import type {AppLocaleEntries} from '../../../i18n';
import type {EditorControlsModel, ThemeEntry} from '../model';
import {ThemeSwatch} from '../ThemeSwatch';
import {
  AboutIcon,
  AppearanceIcon,
  ExperimentsIcon,
  ExternalIcon,
  GeneralIcon,
  NewsIcon,
  RestoreIcon,
} from './icons';
import type {ThemeCardsId} from './preferences';
import {
  DEFAULT_CARDS,
  DEFAULT_LAYOUT,
  LAYOUTS,
  preferences,
  THEME_CARDS,
} from './preferences';
import {LayoutPreview} from './previews';
import type {SectionId} from './settings-state';
import {SECTIONS, settings} from './settings-state';
import * as styles from './settings.css';

/** One setting: a title, a line that explains it, and its control. */
export interface SettingRow {
  readonly id: string;
  readonly title: string;
  readonly highlight?: LocatedHighlightId;
  readonly fresh?: HighlightId;
  readonly experimental?: boolean;
  readonly description: () => string;
  /** Beside the text, or under it for a `wide` row. */
  readonly control: () => JSX.Element;
  /** The control takes the island's width, as the cards with a preview do. */
  readonly wide?: boolean;
  /** A small control, a button or a value, that stays beside the text on a phone. */
  readonly small?: boolean;
}

/** Rows that belong together, drawn as one island. */
export interface SettingGroup {
  readonly title: string;
  readonly rows: readonly SettingRow[];
}

export interface SettingSection {
  readonly id: SectionId;
  readonly name: string;
  readonly icon: Component<{size?: number}>;
  /** One line under the section's title, with what the section is. */
  readonly intro?: string;
  /** An action for the whole section, beside the intro. */
  readonly action?: () => JSX.Element;
  readonly groups: () => readonly SettingGroup[];
}

interface CardOption<T extends string> {
  readonly id: T;
  readonly name: string;
  readonly hint: string;
}

const nameOf = (id: SectionId) =>
  SECTIONS.find(entry => entry.id === id)?.name ?? id;

/** One choice out of a few, each with a picture of what it gives. */
function ChoiceCards<T extends string>(props: {
  label: string;
  options: readonly CardOption<T>[];
  value: string;
  /** The option that is on before any choice, which gets a tag. */
  default: T;
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
                <span class={styles.cardName}>
                  <span>{option.name}</span>
                  <Show when={option.id === props.default}>
                    <span class={styles.tag}>Default</span>
                  </Show>
                </span>
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

/** The kit's segmented control at the kit's height, as wide as its options need. */
function Segmented<T extends string>(props: {
  value: T;
  onChange: (value: T) => void;
  items: readonly {label: string; value: T}[];
}) {
  return (
    <div class={styles.segmented} data-count={props.items.length}>
      <SegmentedField
        adapt
        size={'sm'}
        value={props.value}
        onChange={props.onChange}
        items={props.items}
      />
    </div>
  );
}

/*
 * A segmented control and not the kit's select: the dialog is modal, and
 * Kobalte marks what is added outside it, the select's list too, as hidden
 * from assistive technology.
 */
function LanguageChoice() {
  const [t] = useI18n<AppLocaleEntries>();
  const ui = getUiStore();
  return (
    <Segmented
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
  );
}

/**
 * Every setting of the editor, as data: the dialog draws the sections, and
 * its search reads the same rows. Call it inside a component, since the rows
 * read the stores and the router.
 */
export function createSettingSections(
  model: EditorControlsModel,
): readonly SettingSection[] {
  const ui = getUiStore();
  const auth = getAuth0State();
  const navigate = useNavigate();
  const news = getWhatsNew();

  // The applied theme, or the first one, as the canvas draws it.
  const theme = () => {
    const themes = model.themes();
    return themes.find(entry => entry.active()) ?? themes[0];
  };

  const general: SettingSection = {
    id: 'general',
    name: nameOf('general'),
    icon: GeneralIcon,
    groups: () => [
      {
        title: 'Interface',
        rows: [
          {
            id: 'language',
            title: 'Language',
            description: () =>
              'The language of the menus, labels and messages.',
            control: () => <LanguageChoice />,
          },
        ],
      },
    ],
  };

  const appearance: SettingSection = {
    id: 'appearance',
    name: nameOf('appearance'),
    icon: AppearanceIcon,
    groups: () => [
      {
        title: 'Colours',
        rows: [
          {
            id: 'colour-mode',
            title: 'Colour mode',
            description: () => 'Dark, light, or the same as your system.',
            control: () => (
              <Segmented
                value={ui.get.themeMode}
                onChange={ui.setThemeMode}
                items={[
                  {label: 'Dark', value: 'dark'},
                  {label: 'Light', value: 'light'},
                  {label: 'System', value: 'system'},
                ]}
              />
            ),
          },
        ],
      },
      {
        title: 'Inspector',
        rows: [
          {
            id: 'panel-side',
            title: 'Panel side',
            description: () =>
              preferences.layout() === 'inspector'
                ? 'The side of the canvas the Inspector panel sits on.'
                : 'The side of the canvas the Inspector panel sits on, once the Inspector layout is back on.',
            control: () => (
              <Segmented
                value={preferences.inspectorSide()}
                onChange={preferences.setInspectorSide}
                items={[
                  {label: 'Left', value: 'left'},
                  {label: 'Right', value: 'right'},
                ]}
              />
            ),
          },
        ],
      },
    ],
  };

  const experiments: SettingSection = {
    id: 'experiments',
    name: nameOf('experiments'),
    icon: ExperimentsIcon,
    intro: 'Previews of what may come next. They can change or go away.',
    action: () => (
      <Button
        size={'sm'}
        theme={'secondary'}
        variant={'ghost'}
        disabled={!preferences.experimenting()}
        leftIcon={<RestoreIcon size={16} />}
        onClick={preferences.restoreDefaults}
      >
        Restore defaults
      </Button>
    ),
    groups: () => [
      {
        title: 'Editor',
        rows: [
          {
            id: 'layout',
            highlight: 'layouts',
            title: 'Layout',
            description: () =>
              'Where the controls sit around the canvas. Inspector is the default, Dock and Studio are experiments.',
            wide: true,
            control: () => (
              <ChoiceCards
                label="Layout"
                options={LAYOUTS}
                value={preferences.layout()}
                default={DEFAULT_LAYOUT}
                onChange={value => {
                  preferences.setLayout(value);
                  news.seen('layouts');
                }}
                preview={option => (
                  <LayoutPreview
                    layout={option.id}
                    side={preferences.inspectorSide()}
                  />
                )}
              />
            ),
          },
        ],
      },
      {
        title: 'Theme picker',
        rows: [
          {
            id: 'theme-cards',
            highlight: 'theme-cards',
            title: 'Theme cards',
            description: () =>
              'How the theme picker draws each theme. Window is the default, Orb and Aa list are experiments.',
            wide: true,
            control: () => (
              <Show when={theme()}>
                {current => (
                  <ChoiceCards
                    label="Theme cards"
                    options={THEME_CARDS}
                    value={preferences.themeCards()}
                    default={DEFAULT_CARDS}
                    onChange={value => {
                      preferences.setThemeCards(value);
                      news.seen('theme-cards');
                    }}
                    preview={option => (
                      <ThemeCardsPreview style={option.id} theme={current()} />
                    )}
                  />
                )}
              </Show>
            ),
          },
        ],
      },
    ],
  };

  const library: SettingSection = {
    id: 'whats-new',
    name: nameOf('whats-new'),
    icon: NewsIcon,
    intro: 'Features added to CodeImage, newest first.',
    action: () => (
      <a
        class={styles.historyLink}
        href="https://github.com/riccardoperra/codeimage/releases"
        target="_blank"
        rel="noreferrer"
      >
        Older releases on GitHub ↗
      </a>
    ),
    groups: () =>
      RELEASES.map(release => ({
        title: `${release.title} · ${releaseDate(release)}`,
        rows: release.highlights.map(highlight => ({
          id: `news-${highlight.id}`,
          title: highlight.title,
          description: () => highlight.body,
          fresh: highlight.id,
          experimental: 'experimental' in highlight,
          small: true,
          control: () => (
            <Show when={news.canShowMe(highlight.id)}>
              <Button
                size="sm"
                theme="secondary"
                onClick={() => news.showMe(highlight.id, 'library')}
              >
                Show me
              </Button>
            </Show>
          ),
        })),
      })),
  };

  const about: SettingSection = {
    id: 'about',
    name: nameOf('about'),
    icon: AboutIcon,
    groups: () => [
      {
        title: 'CodeImage',
        rows: [
          {
            id: 'version',
            small: true,
            title: 'Version',
            description: () => 'The release of CodeImage you are using.',
            control: () => (
              <span class={styles.value}>{appEnvironment.version}</span>
            ),
          },
          {
            id: 'github',
            small: true,
            title: 'GitHub',
            description: () => 'The source code, issues and feedback.',
            control: () => (
              <a
                class={buttonStyles.button({theme: 'secondary', size: 'sm'})}
                style={{'text-decoration': 'unset'}}
                target="_blank"
                rel="noreferrer"
                href="https://github.com/riccardoperra/codeimage"
                aria-label="Open CodeImage on GitHub"
              >
                Open
                <ExternalIcon size={14} />
              </a>
            ),
          },
        ],
      },
      ...(auth.loggedIn()
        ? [
            {
              title: 'Account',
              rows: [
                {
                  id: 'logout',
                  small: true,
                  title: 'Log out',
                  description: () => {
                    const name = auth.user()?.name;
                    return name
                      ? `You are signed in as ${name}.`
                      : 'You are signed in.';
                  },
                  control: () => (
                    <Button
                      size={'sm'}
                      theme={'secondary'}
                      onClick={() => {
                        settings.close();
                        void auth.signOut().then(() => navigate('/'));
                      }}
                    >
                      Log out
                    </Button>
                  ),
                },
              ],
            },
          ]
        : []),
    ],
  };

  // One list of rows per section for as long as nothing they read changes,
  // so that a search keeps the rows, and their controls, that still match.
  return [general, appearance, experiments, library, about].map(section => {
    const groups = createMemo(section.groups);
    return {...section, groups};
  });
}
