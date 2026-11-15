import {commandMenu} from '../command-menu/state';
import {NewDot} from '../../../components/WhatsNew/NewDot';
import {getWhatsNew} from '../../../state/whats-new';
import type {AppLocaleEntries} from '../../../i18n';
import {useI18n} from '@codeimage/locale';
import {Dialog, IconButton, TextField} from '@codeui/kit';
import {useModality} from '@core/hooks/isMobile';
import {Dialog as KDialog} from '@kobalte/core/dialog';
import {createEffect, createMemo, For, onCleanup, Show} from 'solid-js';
import type {EditorControlsModel} from '../model';
import {CloseIcon, SearchIcon} from './icons';
import type {SettingGroup, SettingRow, SettingSection} from './sections';
import {createSettingSections} from './sections';
import {settings} from './settings-state';
import * as styles from './settings.css';

function Row(props: {row: SettingRow}) {
  createEffect(() => {
    const id = props.row.fresh;
    if (id) getWhatsNew().opened(id, 'library');
  });
  const titleId = () => `setting-${props.row.id}-title`;
  const descriptionId = () => `setting-${props.row.id}-description`;
  return (
    <div
      class={styles.row}
      role="group"
      aria-labelledby={titleId()}
      aria-describedby={descriptionId()}
      data-setting={props.row.id}
      data-wide={props.row.wide ? '' : undefined}
      data-small={props.row.small ? '' : undefined}
      data-picture={props.row.picture ? '' : undefined}
    >
      <Show when={props.row.picture}>
        {picture => <div class={styles.rowPicture}>{picture()()}</div>}
      </Show>
      <div class={styles.rowText}>
        <span id={titleId()} class={styles.rowTitle}>
          {props.row.title}
          <Show when={props.row.experimental}>
            <span class={styles.tag}>Experiment</span>
          </Show>
          <NewDot at={`setting:${props.row.id}`} />
          <Show when={props.row.fresh && getWhatsNew().isNew(props.row.fresh)}>
            <span class={styles.tag}>New</span>
          </Show>
        </span>
        <span id={descriptionId()} class={styles.rowDescription}>
          {props.row.description()}
        </span>
      </div>
      <div class={styles.rowControl}>{props.row.control()}</div>
    </div>
  );
}

/** Rows that belong together: a title and one island. */
function Group(props: SettingGroup) {
  return (
    <section class={styles.group}>
      <h3 class={styles.groupTitle}>{props.title}</h3>
      <div class={styles.island}>
        <For each={props.rows}>{row => <Row row={row} />}</For>
      </div>
    </section>
  );
}

function Panel(props: {sections: readonly SettingSection[]}) {
  const [t] = useI18n<AppLocaleEntries>();
  const modality = useModality();
  const query = settings.query;
  const setQuery = settings.setQuery;
  // Each opening starts without a search, as when the query was the panel's.
  onCleanup(() => setQuery(''));
  let shell!: HTMLDivElement;
  let search: HTMLInputElement | undefined;

  const current = () =>
    props.sections.find(section => section.id === settings.section()) ??
    props.sections[0];

  const terms = createMemo(() =>
    query().trim().toLowerCase().split(/\s+/).filter(Boolean),
  );
  const searching = () => terms().length > 0;
  const matches = (row: SettingRow) => {
    const text = `${row.title} ${row.description()}`.toLowerCase();
    return terms().every(term => text.includes(term));
  };
  // Every section's rows that match, under the section's name.
  const results = createMemo(() =>
    props.sections
      .map(section => ({
        section,
        rows: section
          .groups()
          .flatMap(group => group.rows)
          .filter(matches),
      }))
      .filter(entry => entry.rows.length > 0),
  );

  const show = (section: SettingSection) => {
    setQuery('');
    settings.setSection(section.id);
  };

  const navItems = () => [
    ...shell.querySelectorAll<HTMLElement>('[data-settings-section]'),
  ];

  // The dialog would focus its first field, the search, which opens a phone's
  // keyboard over the settings. Kobalte asks before it does, with an event on
  // the dialog's panel, and the section on screen takes the focus instead.
  const takeFocus = (event: Event) => {
    if (!(event.target instanceof Node) || !event.target.contains(shell))
      return;
    event.preventDefault();
    shell
      .querySelector<HTMLElement>('[data-settings-section][aria-current]')
      ?.focus();
  };
  document.addEventListener('focusScope.autoFocusOnMount', takeFocus, true);
  onCleanup(() =>
    document.removeEventListener(
      'focusScope.autoFocusOnMount',
      takeFocus,
      true,
    ),
  );

  return (
    <div
      class={styles.shell}
      ref={shell}
      data-settings
      // Native, so that the keys stop here and not at the document.
      on:keydown={(event: KeyboardEvent) => {
        const typing =
          event.target instanceof HTMLElement &&
          event.target.matches('input, textarea, [contenteditable]');
        if (event.key === '/' && !typing) {
          event.preventDefault();
          search?.focus();
        }
      }}
    >
      <div
        class={styles.search}
        on:keydown={(event: KeyboardEvent) => {
          if (event.key === 'Escape' && query()) {
            // Clears the search first; a second Escape closes the dialog.
            event.stopPropagation();
            setQuery('');
          } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            navItems()[0]?.focus();
          }
        }}
      >
        <span class={styles.searchIcon}>
          <SearchIcon size={16} />
        </span>
        <TextField
          size={modality === 'full' ? 'sm' : 'md'}
          placeholder={t('editor.searchSettings')}
          // The kit labels its root, not the input.
          ref={input => {
            search = input;
            createEffect(() =>
              input.setAttribute('aria-label', t('editor.searchSettings')),
            );
          }}
          value={query()}
          onChange={setQuery}
        />
        <kbd class={styles.searchKey} aria-hidden="true">
          /
        </kbd>
      </div>

      <nav
        class={styles.nav}
        aria-label={t('editor.settingsSections')}
        on:keydown={(event: KeyboardEvent) => {
          const step =
            event.key === 'ArrowDown' || event.key === 'ArrowRight'
              ? 1
              : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
                ? -1
                : 0;
          if (!step) return;
          const items = navItems();
          const index = items.findIndex(item => item === event.target);
          if (index < 0) return;
          event.preventDefault();
          items[(index + step + items.length) % items.length]?.focus();
        }}
      >
        <For each={props.sections}>
          {section => (
            <button
              type="button"
              class={styles.navItem}
              data-settings-section={section.id}
              aria-current={
                !searching() && current().id === section.id ? 'page' : undefined
              }
              onClick={() => show(section)}
            >
              <span class={styles.navIcon}>
                <section.icon />
              </span>
              {section.name}
            </button>
          )}
        </For>
      </nav>

      <header class={styles.head}>
        <KDialog.Title class={styles.crumbs}>
          <span class={styles.crumbRoot}>{t('editor.settings')}</span>
          <span class={styles.crumbSlash} aria-hidden="true">
            /
          </span>
          <span>{searching() ? t('editor.search') : current().name}</span>
        </KDialog.Title>
        <KDialog.CloseButton
          as={IconButton}
          class={styles.close}
          aria-label={t('common.close')}
          size={modality === 'full' ? 'sm' : 'md'}
          theme={'secondary'}
          variant={'ghost'}
        >
          <CloseIcon size={18} />
        </KDialog.CloseButton>
      </header>

      <div class={styles.body} data-settings-body>
        <Show
          when={searching()}
          fallback={
            <>
              <Show when={current().intro}>
                <div class={styles.intro}>
                  <p class={styles.introText}>{current().intro}</p>
                  {current().action?.()}
                </div>
              </Show>
              <For each={current().groups()}>
                {group => <Group {...group} />}
              </For>
            </>
          }
        >
          <Show
            when={results().length > 0}
            fallback={
              <p class={styles.empty} role="status">
                {t('editor.noSettings', {query: query().trim()})}
              </p>
            }
          >
            <For each={results()}>
              {entry => <Group title={entry.section.name} rows={entry.rows} />}
            </For>
          </Show>
        </Show>
      </div>
    </div>
  );
}

/**
 * The settings of the editor, in one dialog that the header and the command
 * menu open. A column on the left holds the search and the sections, and the
 * section on screen is a list of groups, each one island of rows. A row is a
 * title, a line that explains it, and its control.
 */
export function SettingsDialog(props: {model: EditorControlsModel}) {
  const sections = createSettingSections(props.model);
  getWhatsNew().bindLocation('setting', row => {
    const section = sections.find(section =>
      section.groups().some(group => group.rows.some(item => item.id === row)),
    );
    if (!section) return;
    commandMenu.close();
    settings.setQuery('');
    settings.open(section.id);
  });
  return (
    <Dialog
      size={'xl'}
      open={settings.isOpen()}
      onOpenChange={open => {
        if (!open) settings.close();
      }}
    >
      <Panel sections={sections} />
    </Dialog>
  );
}
