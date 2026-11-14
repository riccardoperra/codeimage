import {
  createMemo,
  createSignal,
  createUniqueId,
  For,
  onMount,
  Show,
  untrack,
} from 'solid-js';
import type {Action, Command} from './commands';
import {buildCommands, filterCommands} from './commands';
import {useDock} from './context';
import {CheckIcon, SearchIcon} from './icons';

interface Row {
  readonly command: Command;
  readonly index: number;
}

/**
 * Every theme and option, searchable. The highlighted row is previewed on the
 * canvas, Enter keeps it, and closing the menu any other way takes it back.
 */
export function CommandMenu(props: {actions: readonly Action[]}) {
  const dock = useDock();
  const listId = createUniqueId();
  let input!: HTMLInputElement;
  let list!: HTMLDivElement;

  const commands = untrack(() =>
    buildCommands({
      model: dock.model,
      fields: dock.fields,
      actions: props.actions,
      open: dock.open,
    }),
  );

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
    if (command?.change && !command.current) {
      dock.preview(command.change);
    } else {
      dock.cancel();
    }
    if (scroll) {
      document.getElementById(optionId(index))?.scrollIntoView({
        block: 'nearest',
      });
    }
  };

  const run = (command: Command | undefined) => {
    if (!command) return;
    if (command.change) {
      if (!command.current) dock.keep(command.change);
      dock.close();
      return;
    }
    dock.cancel();
    command.run?.();
    // A command that opened another panel keeps the tray.
    if (dock.panel() === 'commands') dock.close();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const count = results().length;
    if (event.key === 'Enter') {
      event.preventDefault();
      run(results()[active()]);
      return;
    }
    if (count === 0) return;
    const step = {ArrowDown: 1, ArrowUp: -1}[event.key];
    if (step === undefined) return;
    event.preventDefault();
    highlight((active() + step + count) % count, true);
  };

  onMount(() => input.focus());

  return (
    <div class="dock-panel dock-commands">
      <label class="dock-commands-input">
        <SearchIcon />
        <input
          ref={input}
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
              dock.cancel();
            }
          }}
          onKeyDown={onKeyDown}
        />
      </label>
      <div
        ref={list}
        id={listId}
        class="dock-command-list"
        role="listbox"
        aria-label="Commands"
      >
        <For each={groups()}>
          {group => (
            <div role="group" aria-label={group.name}>
              <div class="dock-command-group" role="presentation">
                {group.name}
              </div>
              <For each={group.rows}>
                {row => (
                  <div
                    id={optionId(row.index)}
                    class="dock-command"
                    role="option"
                    aria-selected={active() === row.index}
                    data-active={active() === row.index ? '' : undefined}
                    onPointerMove={event => {
                      if (
                        event.pointerType === 'mouse' &&
                        active() !== row.index
                      ) {
                        highlight(row.index, false);
                      }
                    }}
                    onClick={() => run(row.command)}
                  >
                    <span class="dock-command-label">{row.command.label}</span>
                    <Show when={row.command.current}>
                      <CheckIcon />
                    </Show>
                    <Show when={row.command.note}>
                      <span class="dock-command-note">{row.command.note}</span>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          )}
        </For>
        <Show when={results().length === 0}>
          <p class="dock-empty">No theme or option matches “{query()}”.</p>
        </Show>
      </div>
      <p class="dock-hint dock-commands-hint">
        Arrow keys preview. Enter applies. Esc cancels.
      </p>
    </div>
  );
}
