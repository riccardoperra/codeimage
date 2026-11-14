import {assignInlineVars} from '@vanilla-extract/dynamic';
import {createMemo, createSignal, For, Show} from 'solid-js';
import type {ThemeEntry} from '../../model';
import {moveInGrid, SegmentedField} from './controls';
import {CheckIcon, SearchIcon} from './icons';
import type {PanelProps} from './panels';
import * as styles from './studio.css';

const COLUMNS = 3;

type Tone = 'all' | 'dark' | 'light';

const tones = [
  {key: 'all', label: 'All'},
  {key: 'dark', label: 'Dark'},
  {key: 'light', label: 'Light'},
] as const;

export function ThemesPanel(props: PanelProps) {
  const [query, setQuery] = createSignal('');
  const [tone, setTone] = createSignal<Tone>('all');
  const tiles = new Map<string, HTMLButtonElement>();
  let search!: HTMLInputElement;

  const themes = () => props.model.themes();
  const visible = createMemo(() => {
    const term = query().trim().toLowerCase();
    return themes().filter(
      theme =>
        (tone() === 'all' || theme.dark === (tone() === 'dark')) &&
        theme.name.toLowerCase().includes(term),
    );
  });

  // The editor draws the first theme when the stored id matches none, so that
  // is the one to mark.
  const selectedId = () =>
    (themes().find(theme => theme.active()) ?? themes()[0])?.id;
  const tabbableId = () =>
    visible().some(theme => theme.id === selectedId())
      ? selectedId()
      : visible()[0]?.id;

  const select = (theme: ThemeEntry | undefined) => {
    if (!theme) return;
    theme.apply();
    tiles.get(theme.id)?.focus();
  };

  const onGridKeyDown = (e: KeyboardEvent) => {
    const id = (e.target as HTMLElement).dataset.themeId;
    const index = visible().findIndex(theme => theme.id === id);
    if (index < 0) return;
    const next = moveInGrid(e, index, visible().length, COLUMNS);
    if (next !== undefined) select(visible()[next]);
  };

  const onSearchKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      tiles.get(tabbableId() ?? '')?.focus();
    } else if (e.key === 'Enter') {
      select(visible()[0]);
    } else if (e.key === 'Escape' && query()) {
      e.stopPropagation();
      setQuery('');
    }
  };

  return (
    <div class={styles.themeBody}>
      <div class={styles.themeToolbar}>
        <div class={styles.searchBox}>
          <span class={styles.searchIcon}>
            <SearchIcon size={15} />
          </span>
          <input
            ref={search}
            type="search"
            class={styles.searchInput}
            placeholder="Search themes"
            aria-label="Search themes"
            value={query()}
            onInput={e => setQuery(e.currentTarget.value)}
            onKeyDown={onSearchKeyDown}
          />
        </div>
        <SegmentedField
          label="Theme tone"
          hideLabel
          class={styles.toneGroup}
          options={tones}
          value={tone()}
          onChange={key => setTone(key as Tone)}
        />
      </div>

      <div class={styles.themeScroller}>
        <Show
          when={visible().length > 0}
          fallback={
            <div class={styles.emptyState}>
              <p class={styles.hint}>No themes match “{query()}”.</p>
              <button
                type="button"
                class={styles.button}
                onClick={() => {
                  setQuery('');
                  setTone('all');
                  search.focus();
                }}
              >
                Clear search
              </button>
            </div>
          }
        >
          <div
            role="radiogroup"
            aria-label="Themes"
            class={styles.themeGrid}
            style={assignInlineVars({
              [styles.themeRows]: String(
                Math.max(1, Math.ceil(themes().length / COLUMNS)),
              ),
            })}
            onKeyDown={onGridKeyDown}
          >
            <For each={visible()}>
              {theme => (
                <button
                  ref={el => tiles.set(theme.id, el)}
                  type="button"
                  role="radio"
                  aria-checked={theme.id === selectedId()}
                  tabIndex={theme.id === tabbableId() ? 0 : -1}
                  data-theme-id={theme.id}
                  class={styles.themeTile}
                  onClick={() => select(theme)}
                >
                  <span
                    class={styles.themeArt}
                    style={{background: theme.colors.background}}
                  >
                    <span class={styles.themePreview} aria-hidden="true">
                      <props.stage.ThemePreview theme={theme} />
                    </span>
                    <Show when={theme.id === selectedId()}>
                      <span class={styles.themeCheck}>
                        <CheckIcon size={12} />
                      </span>
                    </Show>
                  </span>
                  <span class={styles.themeName}>{theme.name}</span>
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}
