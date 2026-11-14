import {icons} from '@codeui/kit';
import {Dialog} from '@kobalte/core/dialog';
import {
  createMemo,
  createSignal,
  createUniqueId,
  For,
  onCleanup,
  onMount,
  Show,
  untrack,
} from 'solid-js';
import type {EditorControlsModel} from '../model';
import type {Stage} from '../stage';
import * as styles from './command-menu.css';
import type {Action, Command} from './commands';
import {buildCommands, filterCommands} from './commands';
import {createListedModel} from './listed-model';
import {commandMenu} from './state';

interface CommandMenuProps {
  model: EditorControlsModel;
  stage: Stage;
}

interface Row {
  readonly command: Command;
  readonly index: number;
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
  let input!: HTMLInputElement;
  let list!: HTMLDivElement;

  // The production Export button owns the dialog and is the page's one
  // primary button. The frame lets this menu close first.
  const exportImage = () =>
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>(
          '.proto-variant [data-cui="button"][data-theme="primary"]',
        )
        ?.click(),
    );

  const commands = untrack(() => {
    const actions: Action[] = [
      {label: 'Export image…', run: exportImage},
      {label: 'Randomize theme and style', run: props.stage.randomize},
    ];
    if (props.stage.canFormat()) {
      actions.push({
        label: 'Format code',
        run: () => void props.stage.format(),
      });
    }
    return buildCommands({
      model: props.model,
      listed: createListedModel(props.model),
      actions,
      reveal: commandMenu.reveal(),
    });
  });

  const [query, setQuery] = createSignal('');
  const [active, setActive] = createSignal(0);
  const results = createMemo(() => filterCommands(commands, query()));
  const groups = createMemo(() => {
    const grouped: {name: string; rows: Row[]}[] = [];
    results().forEach((command, index) => {
      const last = grouped[grouped.length - 1];
      if (last?.name === command.group) last.rows.push({command, index});
      else grouped.push({name: command.group, rows: [{command, index}]});
    });
    return grouped;
  });

  const optionId = (index: number) => `${listId}-${index}`;

  const highlight = (index: number, scroll: boolean) => {
    setActive(index);
    const command = results()[index];
    if (command?.preview && !command.current) command.preview();
    else props.model.endPreview();
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
  onCleanup(() => props.model.endPreview());

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
          aria-label="Search themes and options"
          placeholder="Search themes and options"
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
              props.model.endPreview();
            }
          }}
          onKeyDown={onKeyDown}
        />
        <span class={styles.hint}>↑↓ preview · ↵ apply · esc cancel</span>
      </label>
      <div
        ref={list}
        id={listId}
        class={styles.list}
        role="listbox"
        aria-label="Commands"
      >
        <For each={groups()}>
          {group => (
            <div role="group" aria-label={group.name}>
              <div class={styles.group} role="presentation">
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
                  >
                    <span class={styles.label}>{row.command.label}</span>
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
          <p class={styles.empty}>No theme or option matches “{query()}”.</p>
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
    giveFocusBack = command.preview !== undefined;
    if (!command.current) command.run();
    commandMenu.close();
  };

  return (
    <Dialog
      open={commandMenu.isOpen()}
      onOpenChange={open => {
        if (!open) commandMenu.close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Content
          class={styles.menu}
          aria-label="Search themes and options"
          data-command-menu
          onCloseAutoFocus={event => {
            event.preventDefault();
            if (giveFocusBack) commandMenu.opener()?.focus();
            giveFocusBack = true;
          }}
        >
          <Commands model={props.model} stage={props.stage} onRun={run} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
