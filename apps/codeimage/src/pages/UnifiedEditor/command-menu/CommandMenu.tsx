import type {Accessor} from 'solid-js';
import type {EditorPageState} from '../page-state';
import {editorLinks, trackEditorLink} from '../shell/links';
import {useI18n} from '@codeimage/locale';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getRootEditorStore} from '@codeimage/store/editor';
import {icons} from '@codeui/kit';
import {RemoteSvgIcon} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {Dialog} from '@kobalte/core/dialog';
import {useNavigate} from '@solidjs/router';
import {
  createMemo,
  createSignal,
  createUniqueId,
  For,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
  untrack,
} from 'solid-js';
import {
  markCommands,
  selectedLines,
  shortcutKeys,
} from '../../../components/CustomEditor/plugins/lineMarks/controls';
import {toggleMark} from '../../../components/CustomEditor/plugins/lineMarks/state';
import type {AppLocaleEntries} from '../../../i18n';
import {getWhatsNew} from '../../../state/whats-new';
import {ControlOverlay, controlOverlay} from '../controls/ControlOverlay';
import {localAi} from '../local-ai/LocalAi';
import {shortcutHelp} from '../controls/ShortcutHelp';
import type {EditorControlsModel} from '../model';
import {exportCommands, settingsCommands} from '../shell/commands';
import {ExternalIcon, GitHubIcon, NewsIcon, SparklesIcon} from '../shell/icons';
import {ThemeSwatch} from '../ThemeSwatch';
import {settings} from '../shell/settings-state';
import type {Stage} from '../stage';
import * as styles from './command-menu.css';
import {buildCommands, filterCommands} from './commands';
import type {Action, Command, Leading} from './commands';
import {createListedModel} from './listed-model';
import {commandMenu} from './state';

interface CommandMenuProps {
  pageState: Accessor<EditorPageState>;
  model: EditorControlsModel;
  stage: Stage;
}

interface Row {
  readonly command: Command;
  readonly index: number;
}

interface Group {
  readonly name: string;
  readonly section?: string;
  readonly rows: Row[];
}

/** The mark at the start of a row, in a box of one size for every kind. */
function RowLeading(props: {leading: Leading}) {
  return (
    <span class={styles.leading} aria-hidden="true">
      <Switch>
        <Match when={props.leading.kind === 'theme' && props.leading} keyed>
          {leading => (
            <ThemeSwatch theme={leading.theme} size={20} variant="syntax-orb" />
          )}
        </Match>
        <Match when={props.leading.kind === 'fill' && props.leading} keyed>
          {leading => (
            <span
              class={styles.fill}
              style={assignInlineVars({[styles.fillValue]: leading.value})}
            />
          )}
        </Match>
        <Match when={props.leading.kind === 'icon' && props.leading} keyed>
          {leading => <leading.icon size={16} />}
        </Match>
        <Match when={props.leading.kind === 'svg' && props.leading} keyed>
          {leading => (
            <RemoteSvgIcon content={leading.content} size="sm" delay={0} />
          )}
        </Match>
      </Switch>
    </span>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="4.25" />
      <path d="m10.25 10.25 3.25 3.25" />
    </svg>
  );
}

/**
 * The list itself, built when the menu opens. The highlighted row is
 * previewed on the canvas through the model, Enter saves it, and closing the
 * menu any other way ends the preview.
 */
function Commands(
  props: CommandMenuProps & {onRun: (command: Command) => void},
) {
  const listId = createUniqueId();
  const [t] = useI18n<AppLocaleEntries>();
  const editor = getRootEditorStore();
  const auth = getAuth0State();
  const navigate = useNavigate();
  let input!: HTMLInputElement;
  let list!: HTMLDivElement;

  const commands = untrack(() => {
    const actions: Action[] = [
      {
        label: t('editor.randomize'),
        icon: SparklesIcon,
        run: props.stage.randomize,
      },
      {label: t('shortcut.buttonAction'), note: '?', run: shortcutHelp.open},
      ...markCommands.map(command => ({
        label: t(`lineMarks.shortcut.${command.id}`),
        note: shortcutKeys(command.key).join(' '),
        run: () => {
          const view = editor.activeEditorView();
          if (!view) return;
          toggleMark(view, selectedLines(view.state), command.kind);
          view.focus();
        },
      })),
    ];
    if (localAi.enabled()) {
      actions.push({label: t('localAi.command'), run: localAi.open});
    }
    if (props.stage.canFormat()) {
      actions.push({
        label: t('editor.formatCode'),
        run: () => void props.stage.format(),
      });
    }
    // What the old menu at the top left held beside Settings.
    const fromOldMenu: Command[] = [
      {
        id: 'whats-new',
        group: t('editor.about'),
        label: t('editor.whatsNew'),
        leading: {kind: 'icon', icon: NewsIcon},
        run: () => settings.open('whats-new'),
      },
      ...editorLinks.map((link): Command => ({
        id: link.id,
        group: t('editor.about'),
        label: t(link.label),
        leading: {
          kind: 'icon',
          icon: link.id === 'github' ? GitHubIcon : ExternalIcon,
        },
        run: () => {
          trackEditorLink(link.id);
          window.open(link.href, '_blank', 'noopener,noreferrer');
        },
      })),
    ];
    if (auth.loggedIn()) {
      fromOldMenu.push({
        id: 'logout',
        group: t('editor.account'),
        label: t('editor.logout'),
        run: () => void auth.signOut().then(() => navigate('/')),
      });
    }
    const safeCommands = [
      ...exportCommands(props.stage.exporter),
      ...settingsCommands(fromOldMenu),
    ];
    if (!props.pageState().editable) return safeCommands;
    return buildCommands({
      model: props.model,
      listed: createListedModel(props.model),
      actions,
      settings: safeCommands,
      reveal: controlOverlay.open,
    });
  });

  const [query, setQuery] = createSignal('');
  const [active, setActive] = createSignal(0);
  const results = createMemo(() => filterCommands(commands, query()));
  const groups = createMemo(() => {
    const grouped: Group[] = [];
    results().forEach((command, index) => {
      const last = grouped[grouped.length - 1];
      const row = {command, index};
      // A heading that repeats its section, such as Font under Font, names it once.
      const section =
        command.section === command.group ? undefined : command.section;
      if (last?.name === command.group && last.section === section) {
        last.rows.push(row);
        return;
      }
      grouped.push({name: command.group, section, rows: [row]});
    });
    return grouped;
  });

  const optionId = (index: number) => `${listId}-${index}`;

  // The command the canvas is previewing. Showing it a second time would
  // undo and redo the same write, and the editor saves after that.
  let previewed: string | undefined;
  const endPreview = () => {
    previewed = undefined;
    props.model.endPreview();
  };

  const highlight = (index: number, scroll: boolean) => {
    setActive(index);
    const command = results()[index];
    if (!command?.preview || command.current) endPreview();
    else if (command.id !== previewed) {
      previewed = command.id;
      command.preview();
    }
    if (scroll) {
      document
        .getElementById(optionId(index))
        ?.scrollIntoView({block: 'nearest'});
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const count = results().length;
    if (event.key === 'Enter') {
      event.preventDefault();
      const command = results()[active()];
      if (command) props.onRun(command);
      return;
    }
    if (count === 0) return;
    const step = {ArrowDown: 1, ArrowUp: -1}[event.key];
    if (step === undefined) return;
    event.preventDefault();
    highlight((active() + step + count) % count, true);
  };

  onMount(() => input.focus());
  // Ended as the menu closes, not when this unmounts: a write made during
  // Solid's cleanup runs its effects later, outside the preview's quiet
  // scope, and the editor would save a restored language.
  onCleanup(commandMenu.onClose(endPreview));
  onCleanup(endPreview);

  return (
    <>
      <label class={styles.field}>
        <SearchIcon />
        <input
          ref={input}
          class={styles.input}
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            results().length > 0 ? optionId(active()) : undefined
          }
          aria-label={t('editor.searchOptions')}
          placeholder={t('editor.searchOptions')}
          autocomplete="off"
          spellcheck={false}
          enterkeyhint="go"
          value={query()}
          onInput={event => {
            setQuery(event.currentTarget.value);
            list.scrollTop = 0;
            // An empty field shows the full list, where the first row is an action.
            if (query().trim()) highlight(0, false);
            else {
              setActive(0);
              endPreview();
            }
          }}
          onKeyDown={onKeyDown}
        />
        <span class={styles.hint}>{t('editor.commandHint')}</span>
      </label>
      <div
        ref={list}
        id={listId}
        class={styles.list}
        role="listbox"
        aria-label={t('editor.commands')}
      >
        <For each={groups()}>
          {group => (
            <div
              role="group"
              aria-label={
                group.section ? `${group.section} ${group.name}` : group.name
              }
            >
              <div class={styles.group} role="presentation">
                <Show when={group.section}>
                  <span class={styles.groupSection}>{group.section}</span>
                  <span class={styles.groupSlash}>/</span>
                </Show>
                {group.name}
              </div>
              <For each={group.rows}>
                {row => (
                  <div
                    id={optionId(row.index)}
                    class={styles.row}
                    role="option"
                    aria-selected={active() === row.index}
                    onPointerMove={event => {
                      if (
                        event.pointerType === 'mouse' &&
                        active() !== row.index
                      ) {
                        highlight(row.index, false);
                      }
                    }}
                    onClick={() => props.onRun(row.command)}
                    aria-label={
                      row.command.value === undefined
                        ? undefined
                        : row.command.label
                    }
                  >
                    <Show
                      when={row.command.leading}
                      keyed
                      fallback={
                        // Keeps the text in line with the rows that have a mark.
                        <Show when={group.rows.some(r => r.command.leading)}>
                          <span class={styles.leading} aria-hidden="true" />
                        </Show>
                      }
                    >
                      {leading => <RowLeading leading={leading} />}
                    </Show>
                    <span class={styles.label}>
                      {row.command.value ?? row.command.label}
                    </span>
                    <Show when={row.command.current}>
                      <icons.CheckIcon class={styles.check} />
                    </Show>
                    <Show when={row.command.note}>
                      <span class={styles.note}>{row.command.note}</span>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          )}
        </For>
        <Show when={results().length === 0}>
          <p class={styles.empty}>{t('editor.noCommand', {query: query()})}</p>
        </Show>
      </div>
    </>
  );
}

/**
 * Every theme and every option of the model, searchable, for any layout. The
 * harness mounts it once. Cmd+K, or Ctrl+K off Apple platforms, opens it, and
 * a layout can add a button through `commandMenu`. It appears at once, with
 * no motion, because it is opened from the keyboard many times a session.
 */
export function CommandMenu(props: CommandMenuProps) {
  const [t] = useI18n<AppLocaleEntries>();
  getWhatsNew().bindLocation('command-menu', () => {
    settings.close();
    requestAnimationFrame(commandMenu.open);
  });

  // A command that only runs, such as Export, moves focus itself.
  let giveFocusBack = true;

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!commandMenu.isShortcut(event)) return;
      event.preventDefault();
      event.stopPropagation();
      if (commandMenu.isOpen()) commandMenu.close();
      else commandMenu.open();
    };
    // Capture, so that the code editor does not take the key first.
    window.addEventListener('keydown', onKeyDown, true);
    onCleanup(() => window.removeEventListener('keydown', onKeyDown, true));
  });
  // Switching layouts unmounts the menu.
  onCleanup(commandMenu.close);

  const run = (command: Command) => {
    getWhatsNew().seen('command-menu');
    giveFocusBack = command.preview !== undefined;
    commandMenu.close();
    if (!command.current) command.run();
  };

  return (
    <>
      <Show when={props.pageState().editable}>
        <ControlOverlay model={props.model} />
      </Show>
      <Dialog
        open={commandMenu.isOpen()}
        onOpenChange={open => {
          if (!open) commandMenu.close();
        }}
      >
        <Dialog.Portal>
          <Dialog.Content
            class={styles.menu}
            aria-label={t('editor.searchOptions')}
            data-command-menu
            onCloseAutoFocus={event => {
              event.preventDefault();
              if (giveFocusBack) commandMenu.opener()?.focus();
              giveFocusBack = true;
            }}
          >
            <Commands
              model={props.model}
              stage={props.stage}
              pageState={props.pageState}
              onRun={run}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}
