import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {useStore} from 'statebuilder';
import {useI18n} from '@codeimage/locale';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getUiStore} from '@codeimage/store/ui';
import {RangeField} from '@codeimage/ui';
import {Button} from '@codeui/kit';
import {appEnvironment} from '@core/configuration';
import {getUmami} from '@core/constants/umami';
import {RadioGroup} from '@ui/RadioGroup/RadioGroup';
import {useNavigate} from '@solidjs/router';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import type {Component} from 'solid-js';
import type {JSX} from '@solidjs/web';
import {
  createMemo,
  createSignal,
  For,
  Match,
  onCleanup,
  onSettled,
  Show,
  Switch,
} from 'solid-js';
import {createResource} from '@codeimage/store/plugins/create-resource';
import {Dynamic} from '@solidjs/web';
import {illustrations} from '../../../components/WhatsNew/illustrations';
import {
  releaseDate,
  releaseTitle,
} from '../../../components/WhatsNew/releaseDate';
import {getWhatsNew, RELEASES} from '../../../state/whats-new';
import type {HighlightId} from '../../../state/whats-new';
import {CopyAltTextButton} from '../../../components/Toolbar/CopyAltTextButton';
import {ExportExtension} from '../../../hooks/use-export-image';
import {EXPORT_SCALES, exportFormats, JPEG_QUALITY} from './export-formats';
import type {AppLocaleEntries} from '../../../i18n';
import {SwitchField} from '../controls/fields';
import type {EditorControlsModel} from '../model';
import {
  AboutIcon,
  AppearanceIcon,
  CheckIcon,
  CloseIcon,
  ExperimentsIcon,
  ExportIcon,
  ExternalIcon,
  GeneralIcon,
  NewsIcon,
  RestoreIcon,
} from './icons';
import {
  COLOUR_MODES,
  PANEL_NAVS,
  DEFAULT_CARDS,
  DEFAULT_LAYOUT,
  EXPORT_STYLES,
  LAYOUTS,
  LOCAL_AI_PROVIDERS,
  preferences,
  THEME_CARDS,
} from './preferences';
import type {ModelState} from '../local-ai/language-model';
import {languageModel} from '../local-ai/providers';
import type {Requirement, RequirementStatus} from '../local-ai/requirements';
import {
  checkRequirements,
  MEMORY_CAP,
  readEnvironment,
} from '../local-ai/requirements';
import {ColourModeOrb, LayoutPreview, NavPreview} from './previews';
import type {SectionId} from './settings-state';
import {SECTIONS, settings} from './settings-state';
import * as styles from './settings.css';
import {ThemeCardsPreview} from './settings-theme-cards-preview';
import {editorLinks, trackEditorLink} from './links';

/** One setting: a title, a line that explains it, and its control. */
export interface SettingRow {
  readonly id: string;
  readonly title: string;
  readonly fresh?: HighlightId;
  readonly experimental?: boolean;
  /** A small picture before the text, as the archive's rows have. */
  readonly picture?: () => JSX.Element;
  readonly description: () => string;
  /** More than a line can say, under the description. Search reads only the description. */
  readonly details?: () => JSX.Element;
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
  const [t] = useI18n<AppLocaleEntries>();
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
                    <span class={styles.tag}>{t('editor.default')}</span>
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

type Translate = ReturnType<typeof useI18n<AppLocaleEntries>>[0];

/** Where the on-device model stands, in words. */
function modelStatus(t: Translate) {
  const state = languageModel.state();
  switch (state.kind) {
    case 'available':
      return t('localAi.modelReady');
    case 'downloadable':
      return t('localAi.modelDownloadable');
    case 'downloading':
      return state.loaded === undefined
        ? t('localAi.modelNoProgress')
        : t('localAi.modelDownloading');
    case 'failed':
      return t('localAi.modelFailed', {message: state.error});
    default:
      return t('localAi.modelUnavailable');
  }
}

/** What the on-device model needs next: a download, its progress, or nothing. */
function ModelControl() {
  const [t] = useI18n<AppLocaleEntries>();
  // Each visit to Experiments asks Chrome again, so the row is never stale.
  onSettled(() => void languageModel.refresh());
  const downloading = () => {
    const state = languageModel.state();
    return state.kind === 'downloading' ? state : undefined;
  };
  const download = (label: string) => (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => void languageModel.download()}
    >
      {label}
    </Button>
  );
  return (
    <Switch>
      <Match when={languageModel.state().kind === 'downloadable'}>
        {download(t('localAi.download'))}
      </Match>
      <Match when={languageModel.state().kind === 'failed'}>
        {download(t('localAi.retry'))}
      </Match>
      <Match when={languageModel.state().kind === 'unavailable'}>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void languageModel.refresh()}
        >
          {t('localAi.checkAgain')}
        </Button>
      </Match>
      <Match when={downloading()}>
        {state => (
          <>
            <Show
              when={state().loaded === undefined && !languageModel.requesting()}
            >
              {download(t('localAi.restartDownload'))}
            </Show>
            <Show
              when={state().loaded}
              fallback={
                <progress
                  class={styles.progress}
                  aria-label={t('localAi.modelDownloading')}
                />
              }
            >
              {loaded => (
                <span class={styles.progressValue}>
                  <progress
                    class={styles.progress}
                    aria-label={t('localAi.modelDownloading')}
                    value={loaded()}
                    max={1}
                  />
                  {Math.round(loaded() * 100)}%
                </span>
              )}
            </Show>
          </>
        )}
      </Match>
    </Switch>
  );
}

/** What this device shows for a requirement, or where to look when the page cannot tell. */
function requirementNote(t: Translate, requirement: Requirement) {
  switch (requirement.id) {
    case 'browser':
      return requirement.version === undefined
        ? t('localAi.unknown.browser')
        : t('localAi.found.browser', {version: String(requirement.version)});
    case 'os':
      return requirement.system ?? t('localAi.unknown.os');
    case 'cpu':
      return requirement.cores === undefined
        ? t('localAi.unknown.cpu')
        : t('localAi.found.cpu', {cores: String(requirement.cores)});
    case 'memory':
      return requirement.gb !== undefined && requirement.gb < MEMORY_CAP
        ? t('localAi.found.memory', {gb: String(requirement.gb)})
        : t('localAi.unknown.memory');
    case 'disk':
      return t('localAi.unknown.disk');
    case 'setting':
      return t('localAi.unknown.setting');
  }
}

const MARKS: Record<RequirementStatus, () => JSX.Element> = {
  met: () => <CheckIcon size={12} />,
  unmet: () => <CloseIcon size={12} />,
  unknown: () => <>?</>,
};

// Chrome does not let a page open chrome:// addresses, so the user copies them.
const SETTINGS_ADDRESS = {
  address: 'chrome://settings/ai',
  hint: 'localAi.settingsAddress',
} as const;
const INTERNALS_ADDRESS = {
  address: 'chrome://on-device-internals',
  hint: 'localAi.internalsAddress',
} as const;
// Chrome often reports no progress, and its internals page shows the download.
const DOWNLOAD_ADDRESS = {
  address: 'chrome://on-device-internals',
  hint: 'localAi.downloadAddress',
} as const;

/** The Chrome pages worth opening in each state of the model. */
function chromeAddresses(state: ModelState) {
  switch (state.kind) {
    case 'unavailable':
    case 'downloadable':
    case 'failed':
      return [SETTINGS_ADDRESS, INTERNALS_ADDRESS];
    case 'downloading':
      return state.loaded === undefined ? [DOWNLOAD_ADDRESS] : [];
    default:
      return [];
  }
}

function CopyAddress(props: {address: string}) {
  const [t] = useI18n<AppLocaleEntries>();
  const [copied, setCopied] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(timer));
  const copy = async () => {
    // When the clipboard refuses, the address stays selectable by hand.
    await navigator.clipboard.writeText(props.address).catch(() => {});
    setCopied(true);
    clearTimeout(timer);
    timer = setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      class={styles.copyAddress}
      aria-label={
        copied()
          ? undefined
          : t('localAi.copyAddress', {address: props.address})
      }
      onClick={() => void copy()}
    >
      <span aria-live="polite">
        {copied() ? t('localAi.copied') : t('localAi.copy')}
      </span>
    </button>
  );
}

/**
 * Chrome's requirements for its model, checked where the page can read them,
 * and the Chrome pages that say the rest. The requirements show until the
 * model is on its way.
 */
function ModelRequirements() {
  const [t] = useI18n<AppLocaleEntries>();
  const [environment] = createResource(readEnvironment);
  const needed = () =>
    ['unavailable', 'downloadable', 'failed'].includes(
      languageModel.state().kind,
    );
  const addresses = createMemo(() => chromeAddresses(languageModel.state()));
  return (
    <Show when={addresses().length > 0}>
      <div class={styles.modelDetails}>
        <Show when={needed() && environment()}>
          {env => (
            <ul
              class={styles.requirements}
              aria-label={t('localAi.requirementsTitle')}
            >
              <For each={checkRequirements(env())}>
                {requirement => (
                  <li
                    class={styles.requirement}
                    data-requirement={requirement.id}
                    data-status={requirement.status}
                  >
                    <span
                      class={styles.requirementMark}
                      role="img"
                      aria-label={t(`localAi.status.${requirement.status}`)}
                    >
                      {MARKS[requirement.status]()}
                    </span>
                    <span>
                      {t(`localAi.requirement.${requirement.id}`)}
                      <span class={styles.requirementNote}>
                        {requirementNote(t, requirement)}
                      </span>
                    </span>
                  </li>
                )}
              </For>
            </ul>
          )}
        </Show>
        <div class={styles.addresses}>
          <For each={addresses()}>
            {entry => (
              <div class={styles.address} data-address={entry.address}>
                <code class={styles.addressCode}>{entry.address}</code>
                <CopyAddress address={entry.address} />
                <span>{t(entry.hint)}</span>
              </div>
            )}
          </For>
          <span>{t('localAi.pasteHint')}</span>
        </div>
      </div>
    </Show>
  );
}

/**
 * Every setting of the editor, as data: the dialog draws the sections, and
 * its search reads the same rows. Call it inside a component, since the rows
 * read the stores and the router.
 */
export function createSettingSections(model: EditorControlsModel) {
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  const config = useStore(EditorConfigStore);
  const nameOf = (id: SectionId) =>
    t(SECTIONS.find(entry => entry.id === id)!.name);
  const ui = getUiStore();
  const auth = getAuth0State();
  const navigate = useNavigate();
  const news = getWhatsNew();

  // The applied theme, or the first one, as the canvas draws it.
  const theme = () => {
    const themes = model.themes();
    return themes.find(entry => entry.active()) ?? themes[0];
  };

  const general = {
    id: 'general' as const,
    get name() {
      return nameOf('general');
    },
    icon: GeneralIcon,
    groups: createMemo(() => [
      {
        title: t('editor.interface'),
        rows: [
          {
            id: 'language' as const,
            title: t('editor.language'),
            description: () => t('editor.languageHint'),
            control: () => <LanguageChoice />,
          },
        ],
      },
    ]),
  } satisfies SettingSection;

  const appearance = {
    id: 'appearance' as const,
    get name() {
      return nameOf('appearance');
    },
    icon: AppearanceIcon,
    groups: createMemo(() => [
      {
        title: t('editor.colours'),
        rows: [
          {
            id: 'colour-mode' as const,
            title: t('editor.colourMode'),
            description: () => t('editor.colourModeHint'),
            wide: true,
            control: () => (
              <ChoiceCards
                label={t('editor.colourMode')}
                options={COLOUR_MODES.map(option => ({
                  ...option,
                  name: t(option.name),
                  hint: t(option.hint),
                }))}
                value={ui.get.themeMode}
                default={'dark'}
                onChange={ui.setThemeMode}
                preview={option => <ColourModeOrb mode={option.id} />}
              />
            ),
          },
        ],
      },
      {
        title: t('editor.sidebar'),
        rows: [
          {
            id: 'panel-nav' as const,
            title: t('editor.panelNav'),
            description: () =>
              preferences.layout() === 'sidebar'
                ? t('editor.panelNavHint')
                : t('editor.panelInactiveHint'),
            wide: true,
            control: () => (
              <ChoiceCards
                label={t('editor.panelNav')}
                options={PANEL_NAVS.map(option => ({
                  ...option,
                  name: t(option.name),
                  hint: t(option.hint),
                }))}
                value={preferences.panelNav()}
                default={'accordion'}
                onChange={preferences.setPanelNav}
                preview={option => (
                  <NavPreview nav={option.id} side={preferences.panelSide()} />
                )}
              />
            ),
          },
          {
            id: 'panel-side' as const,
            title: t('editor.panelSide'),
            description: () =>
              preferences.layout() === 'sidebar'
                ? t('editor.panelSideHint')
                : t('editor.panelInactiveHint'),
            control: () => (
              <Segmented
                value={preferences.panelSide()}
                onChange={preferences.setPanelSide}
                items={[
                  {label: t('signature.left'), value: 'left'},
                  {label: t('signature.right'), value: 'right'},
                ]}
              />
            ),
          },
        ],
      },
      {
        title: t('toolbar.export'),
        rows: [
          {
            id: 'export-style' as const,
            title: t('editor.exportStyle'),
            description: () => t('editor.exportStyleHint'),
            control: () => (
              <Segmented
                value={preferences.exportStyle()}
                onChange={preferences.setExportStyle}
                items={EXPORT_STYLES.map(style => ({
                  label: t(style.name),
                  value: style.id,
                }))}
              />
            ),
          },
        ],
      },
    ]),
  } satisfies SettingSection;

  const supported = createMemo(
    () => languageModel.state().kind !== 'unsupported',
  );
  const experiments = {
    id: 'experiments' as const,
    get name() {
      return nameOf('experiments');
    },
    icon: ExperimentsIcon,
    get intro() {
      return t('editor.experimentsHint');
    },
    action: () => (
      <Button
        size={'sm'}
        variant={'secondary'}
        ghost
        disabled={
          !preferences.experimenting() && config.get.renderer === 'dom-export'
        }
        leftIcon={<RestoreIcon size={16} />}
        onClick={() => {
          preferences.restoreDefaults();
          config.setRenderer('dom-export');
        }}
      >
        {t('editor.restoreDefaults')}
      </Button>
    ),
    groups: createMemo(() => [
      ...(!supported()
        ? []
        : [
            {
              title: t('localAi.experiment'),
              rows: [
                {
                  id: 'local-ai' as const,
                  title: t('localAi.experiment'),
                  description: () => t('localAi.experimentHint'),
                  small: true,
                  control: () => (
                    <SwitchField
                      id="settings-local-ai"
                      label={t('localAi.experimentSwitch')}
                      checked={
                        preferences.localAi() &&
                        languageModel.state().kind === 'available'
                      }
                      disabled={languageModel.state().kind !== 'available'}
                      onChange={preferences.setLocalAi}
                    />
                  ),
                },
                {
                  id: 'local-ai-provider' as const,
                  title: t('localAi.provider'),
                  description: () => t('localAi.providerHint'),
                  small: true,
                  control: () => (
                    <Segmented
                      value={preferences.localAiProvider()}
                      onChange={id => {
                        preferences.setLocalAiProvider(id);
                        void languageModel.refresh();
                      }}
                      items={LOCAL_AI_PROVIDERS.map(provider => ({
                        label: t(provider.name),
                        value: provider.id,
                      }))}
                    />
                  ),
                },
                {
                  id: 'local-ai-model' as const,
                  title: t('localAi.model'),
                  description: () => modelStatus(t),
                  details: () => <ModelRequirements />,
                  small: true,
                  control: () => <ModelControl />,
                },
              ],
            },
          ]),
      {
        title: t('rendering.engine'),
        rows: [
          {
            id: 'rendering-engine' as const,
            title: t('rendering.takumi'),
            description: () => t('rendering.experimentalDescription'),
            small: true,
            control: () => (
              <SwitchField
                id="settings-rendering-engine"
                label={t('rendering.useTakumi')}
                checked={config.get.renderer === 'takumi'}
                onChange={checked => {
                  config.setRenderer(checked ? 'takumi' : 'dom-export');
                  getWhatsNew().seen('takumi');
                }}
              />
            ),
          },
        ],
      },
      {
        title: t('frame.editor'),
        rows: [
          {
            id: 'layout' as const,
            title: t('editor.layout'),
            description: () => t('editor.layoutHint'),
            wide: true,
            control: () => (
              <ChoiceCards
                label={t('editor.layout')}
                options={LAYOUTS.map(option => ({
                  ...option,
                  name: t(option.name),
                  hint: t(option.hint),
                }))}
                value={preferences.layout()}
                default={DEFAULT_LAYOUT}
                onChange={preferences.setLayout}
                preview={option => (
                  <LayoutPreview
                    layout={option.id}
                    nav={preferences.panelNav()}
                    side={preferences.panelSide()}
                  />
                )}
              />
            ),
          },
        ],
      },
      {
        title: t('editor.themePicker'),
        rows: [
          {
            id: 'theme-cards' as const,
            title: t('editor.themeCards'),
            description: () => t('editor.themeCardsHint'),
            wide: true,
            control: () => (
              <Show when={theme()}>
                {current => (
                  <ChoiceCards
                    label={t('editor.themeCards')}
                    options={THEME_CARDS.map(option => ({
                      ...option,
                      name: t(option.name),
                      hint: t(option.hint),
                    }))}
                    value={preferences.themeCards()}
                    default={DEFAULT_CARDS}
                    onChange={preferences.setThemeCards}
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
    ]),
  } satisfies SettingSection;

  // Every row reads and writes the production export store, the one that
  // today's export popover and dialog share, so there is one value for each.
  const exportStore = getExportCanvasStore();
  const target = () => getFrameState().exportTarget();
  const exportSection = {
    id: 'export' as const,
    get name() {
      return nameOf('export');
    },
    icon: ExportIcon,
    get intro() {
      return t('editor.exportHint');
    },
    groups: createMemo(() => [
      {
        title: t('editor.image'),
        rows: [
          {
            id: 'export-format' as const,
            title: t('editor.format'),
            description: () =>
              exportStore.get.extension === ExportExtension.jpeg
                ? t('editor.jpegHint')
                : t('editor.formatHint'),
            control: () => (
              <Segmented
                value={exportStore.get.extension}
                onChange={exportStore.setExtension}
                items={exportFormats.map(format => ({
                  label: format.name,
                  value: format.extension,
                }))}
              />
            ),
          },
          ...(exportStore.get.extension === ExportExtension.jpeg
            ? [
                {
                  id: 'export-quality' as const,
                  title: t('export.quality'),
                  description: () =>
                    t('editor.qualityHint', {
                      quality: String(exportStore.get.jpegQuality),
                    }),
                  control: () => (
                    <div class={styles.range}>
                      <RangeField
                        value={exportStore.get.jpegQuality}
                        onChange={exportStore.setJpegQuality}
                        min={JPEG_QUALITY.min}
                        max={JPEG_QUALITY.max}
                        step={JPEG_QUALITY.step}
                      />
                    </div>
                  ),
                },
              ]
            : []),
          {
            id: 'export-scale' as const,
            title: t('export.pixelRatio'),
            description: () =>
              target()
                ? t('editor.targetPixels', {
                    name: target() ? t(`frame.targets.${target()!.id}`) : '',
                    resolution: target()?.resolution.join(' × ') ?? '',
                  })
                : t('editor.imagePixels', {
                    resolution: exportStore.canvasResolution(),
                  }),
            control: () => (
              <Show
                when={!target()}
                fallback={
                  <span class={styles.value}>
                    {getFrameState().exportPixelRatio(
                      exportStore.get.devicePixelRatio,
                    )}
                    x
                  </span>
                }
              >
                <Segmented
                  value={String(exportStore.get.devicePixelRatio)}
                  onChange={value =>
                    exportStore.setDevicePixelRatio(Number(value))
                  }
                  items={EXPORT_SCALES.map(scale => ({
                    label: `${scale}x`,
                    value: String(scale),
                  }))}
                />
              </Show>
            ),
          },
          {
            id: 'export-alt-text' as const,
            title: t('altText.copy'),
            description: () => t('altText.hint'),
            small: true,
            control: () => <CopyAltTextButton />,
          },
        ],
      },
      {
        title: t('editor.tabs'),
        rows: [
          {
            id: 'export-active-tab' as const,
            title: t('exportTabs.showOnlyActiveTab'),
            description: () => t('editor.activeTabHint'),
            small: true,
            control: () => (
              <SwitchField
                id="settings-export-active-tab"
                label={t('exportTabs.showOnlyActiveTab')}
                checked={exportStore.get.showOnlyActiveTab}
                onChange={exportStore.setShowOnlyActiveTab}
              />
            ),
          },
        ],
      },
    ]),
  } satisfies SettingSection;

  const library = {
    id: 'whats-new' as const,
    get name() {
      return nameOf('whats-new');
    },
    icon: NewsIcon,
    get intro() {
      return t('whatsNew.intro');
    },
    action: () => (
      <a
        class={styles.historyLink}
        href="https://github.com/riccardoperra/codeimage/releases"
        target="_blank"
        rel="noreferrer"
      >
        {t('whatsNew.older')} ↗
      </a>
    ),
    groups: createMemo(() =>
      RELEASES.map(release => ({
        title: `${releaseTitle(release, locale())} · ${releaseDate(release, locale())}`,
        rows: release.highlights.map(highlight => ({
          id: `news-${highlight.id}` as const,
          title: t(`whatsNew.highlights.${highlight.id}.title`),
          description: () => t(`whatsNew.highlights.${highlight.id}.body`),
          fresh: highlight.id,
          experimental: 'experimental' in highlight,
          picture: () => (
            <Dynamic component={illustrations[highlight.id]} mode="thumb" />
          ),
          small: true,
          control: () => {
            if (highlight.where === null) return;
            return (
              <Show when={news.canShowMe(highlight.id)}>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => news.showMe(highlight.id, 'library')}
                >
                  {t('whatsNew.showMe')}
                </Button>
              </Show>
            );
          },
        })),
      })),
    ),
  } satisfies SettingSection;

  const about = {
    id: 'about' as const,
    get name() {
      return nameOf('about');
    },
    icon: AboutIcon,
    groups: createMemo(() => [
      {
        title: 'CodeImage',
        rows: [
          {
            id: 'version' as const,
            small: true,
            title: t('editor.version'),
            description: () => t('editor.versionHint'),
            control: () => (
              <span class={styles.value}>{appEnvironment.version}</span>
            ),
          },
          ...editorLinks.map(link => ({
            id: link.id,
            small: true,
            title: t(link.label),
            description: () => link.href.replace('https://', ''),
            control: () => (
              <Button
                as="a"
                variant="secondary"
                size="sm"
                target="_blank"
                rel="noreferrer"
                href={link.href}
                aria-label={
                  link.id === 'github' ? t('editor.openGithub') : t(link.label)
                }
                onClick={() => trackEditorLink(link.id)}
              >
                {t('toolbar.openNewTab')}
                <ExternalIcon size={14} />
              </Button>
            ),
          })),
        ],
      },
      ...(auth.loggedIn()
        ? [
            {
              title: t('editor.account'),
              rows: [
                {
                  id: 'logout' as const,
                  small: true,
                  title: t('editor.logout'),
                  description: () => {
                    const name = auth.user()?.name;
                    return name
                      ? t('editor.signedInAs', {name})
                      : t('editor.signedIn');
                  },
                  control: () => (
                    <Button
                      size={'sm'}
                      variant={'secondary'}
                      onClick={() => {
                        settings.close();
                        void auth.signOut().then(() => navigate('/'));
                      }}
                    >
                      {t('editor.logout')}
                    </Button>
                  ),
                },
              ],
            },
          ]
        : []),
    ]),
  } satisfies SettingSection;

  // One list of rows per section for as long as nothing they read changes,
  // so that a search keeps the rows, and their controls, that still match.
  return [
    general,
    appearance,
    exportSection,
    experiments,
    library,
    about,
  ] satisfies readonly SettingSection[];
}

export type SettingRowId = ReturnType<
  ReturnType<typeof createSettingSections>[number]['groups']
>[number]['rows'][number]['id'];
