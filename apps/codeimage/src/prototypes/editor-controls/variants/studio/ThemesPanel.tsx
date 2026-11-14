import {Button, TextField} from '@codeui/kit';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {createMemo, createSignal, For, onCleanup, Show} from 'solid-js';
import type {ThemeEntry} from '../../model';
import {ThemeSwatch} from '../../ThemeSwatch';
import {moveInGrid} from './controls';
import {MoonIcon, SunIcon} from './icons';
import type {PanelProps} from './panels';
import * as styles from './studio.css';

const COLUMNS = 3;

type Tone = 'all' | 'dark' | 'light';

const tones: {label: string; value: Tone}[] = [
  {label: 'All', value: 'all'},
  {label: 'Dark', value: 'dark'},
  {label: 'Light', value: 'light'},
];

export function ThemesPanel(props: PanelProps) {
  const [query, setQuery] = createSignal('');
  const [tone, setTone] = createSignal<Tone>('all');
  // The canvas is the preview; the model shows a theme without saving it.
  const [previewing, setPreviewing] = createSignal(false);
  const preview = {
    preview(theme: ThemeEntry) {
      theme.preview();
      setPreviewing(true);
    },
    commit(theme: ThemeEntry) {
      setPreviewing(false);
      theme.apply();
    },
    cancel() {
      if (!previewing()) return false;
      setPreviewing(false);
      props.model.endPreview();
      return true;
    },
  };
  onCleanup(preview.cancel);
  const cards = new Map<string, HTMLButtonElement>();
  let grid: HTMLDivElement | undefined;

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
  // is the one to mark. `active()` stays on the applied theme during a preview.
  const selectedId = () =>
    (themes().find(theme => theme.active()) ?? themes()[0])?.id;
  const tabbableId = () =>
    visible().some(theme => theme.id === selectedId())
      ? selectedId()
      : visible()[0]?.id;

  const onGridKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && preview.cancel()) {
      e.stopPropagation();
      return;
    }
    const id = (e.target as HTMLElement).dataset.themeId;
    const index = visible().findIndex(theme => theme.id === id);
    if (index < 0) return;
    const next = moveInGrid(e, index, visible().length, COLUMNS);
    if (next !== undefined) cards.get(visible()[next].id)?.focus();
  };

  const onSearchKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      cards.get(tabbableId() ?? '')?.focus();
    } else if (e.key === 'Enter') {
      const first = visible()[0];
      if (first) preview.commit(first);
    } else if (e.key === 'Escape' && query()) {
      e.stopPropagation();
      setQuery('');
    }
  };

  return (
    <div class={styles.themeBody}>
      <div class={styles.themeToolbar}>
        <div class={styles.themeSearch} onKeyDown={onSearchKeyDown}>
          <TextField
            size={props.size()}
            placeholder="Search themes"
            aria-label="Search themes"
            value={query()}
            onChange={setQuery}
          />
        </div>
        <div class={styles.themeTones}>
          <SegmentedField
            adapt
            size={props.size()}
            value={tone()}
            onChange={setTone}
            items={tones}
          />
        </div>
      </div>

      <div class={styles.themeScroller}>
        <Show
          when={visible().length > 0}
          fallback={
            <div class={styles.emptyState}>
              No themes match “{query()}”.
              <Button
                size="sm"
                theme="secondary"
                onClick={() => {
                  setQuery('');
                  setTone('all');
                }}
              >
                Clear search
              </Button>
            </div>
          }
        >
          <div
            ref={grid}
            role="listbox"
            aria-label="Themes"
            class={styles.themeGrid}
            onKeyDown={onGridKeyDown}
            onPointerLeave={e => e.pointerType === 'mouse' && preview.cancel()}
            onFocusOut={e => {
              if (!grid?.contains(e.relatedTarget as Node)) preview.cancel();
            }}
          >
            <For each={visible()}>
              {theme => (
                <button
                  ref={el => cards.set(theme.id, el)}
                  type="button"
                  role="option"
                  aria-selected={theme.id === selectedId()}
                  tabIndex={theme.id === tabbableId() ? 0 : -1}
                  data-theme-id={theme.id}
                  class={styles.themeCard}
                  onPointerEnter={e =>
                    e.pointerType === 'mouse' && preview.preview(theme)
                  }
                  onFocus={() => preview.preview(theme)}
                  onClick={() => preview.commit(theme)}
                >
                  <span
                    class={styles.themeTone}
                    title={theme.dark ? 'Dark' : 'Light'}
                  >
                    {theme.dark ? (
                      <MoonIcon size={14} />
                    ) : (
                      <SunIcon size={14} />
                    )}
                  </span>
                  <span class={styles.themeOrb}>
                    <ThemeSwatch theme={theme} size={props.phone() ? 40 : 48} />
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
