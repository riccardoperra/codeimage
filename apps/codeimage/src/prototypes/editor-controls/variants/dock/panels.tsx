import {Tabs} from '@kobalte/core/tabs';
import type {JSX} from 'solid-js';
import {createMemo, createSignal, For, Match, Show, Switch} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {FontSystemPicker} from '../../../../components/PropertyEditor/controls/FontPicker/FontSystemPicker';
import type {ThemeEntry} from '../../model';
import {useDock} from './context';
import {ControlRow, ListRow, Segmented, SwitchRow} from './controls';
import type {ChoiceControl, DetailId, GroupId} from './fields';
import {GROUPS} from './fields';
import {BackIcon, CheckIcon, SearchIcon, ShuffleIcon, WandIcon} from './icons';
import {OptionGrid} from './OptionGrid';
import {choicePreview, shownTheme, themePreview} from './preview';
import {WindowStyleArt} from './WindowStyleArt';

const PREVIEW_HINT = 'Arrow keys preview. Enter applies. Esc cancels.';

function SearchField(props: {
  ref: (element: HTMLInputElement) => void;
  label: string;
  value: string;
  onInput: (value: string) => void;
  /** Arrow down leaves the field for the list. */
  onDown: () => void;
  onEnter: () => void;
}) {
  return (
    <label class="dock-search">
      <SearchIcon />
      <input
        ref={props.ref}
        type="search"
        placeholder={props.label}
        aria-label={props.label}
        autocomplete="off"
        spellcheck={false}
        value={props.value}
        onInput={e => props.onInput(e.currentTarget.value)}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            props.onDown();
          } else if (e.key === 'Enter') {
            e.preventDefault();
            props.onEnter();
          }
        }}
      />
    </label>
  );
}

function PanelHead(props: {
  title: string;
  children?: JSX.Element;
  hint?: boolean;
}) {
  return (
    <header class="dock-panel-head">
      <h2 class="dock-panel-title">{props.title}</h2>
      {props.children}
      <Show when={props.hint}>
        <p class="dock-hint">{PREVIEW_HINT}</p>
      </Show>
    </header>
  );
}

function ThemeTile(props: {theme: ThemeEntry}) {
  const dock = useDock();
  return (
    <Show
      when={!dock.compact()}
      fallback={
        <span
          class="dock-theme-chip"
          style={{background: props.theme.colors.background}}
        >
          <span
            class="dock-theme-chip-name"
            style={{
              background: props.theme.colors.window,
              color: props.theme.colors.text,
            }}
          >
            {props.theme.name}
          </span>
        </span>
      }
    >
      <span
        class="dock-theme-art"
        style={{background: props.theme.colors.background}}
        inert
      >
        <span class="dock-theme-code">
          <dock.stage.ThemePreview theme={props.theme} />
        </span>
      </span>
      <span class="dock-theme-name" title={props.theme.name}>
        <span class="dock-theme-name-text">{props.theme.name}</span>
        <CheckIcon />
      </span>
    </Show>
  );
}

export function ThemesPanel() {
  const dock = useDock();
  const [query, setQuery] = createSignal('');
  let search: HTMLInputElement | undefined;
  let panel!: HTMLDivElement;

  const themes = createMemo(() => {
    const words = query().trim().toLowerCase();
    return dock.model
      .themes()
      .filter(theme => theme.name.toLowerCase().includes(words));
  });
  const firstOption = () => panel.querySelector<HTMLElement>('[role="option"]');

  return (
    <div class="dock-panel dock-themes" ref={panel}>
      <Show when={!dock.compact()}>
        <PanelHead title="Theme" hint>
          <SearchField
            ref={element => (search = element)}
            label={`Search ${dock.model.themes().length} themes`}
            value={query()}
            onInput={setQuery}
            onDown={() => firstOption()?.focus()}
            onEnter={() => firstOption()?.click()}
          />
          <button
            type="button"
            class="dock-button"
            onClick={() => dock.stage.randomize()}
          >
            <ShuffleIcon />
            Randomize
          </button>
        </PanelHead>
      </Show>
      <Show
        when={themes().length > 0}
        fallback={
          <p class="dock-empty">
            No theme matches “{query()}”.{' '}
            <button
              type="button"
              class="dock-link"
              onClick={() => {
                setQuery('');
                search?.focus();
              }}
            >
              Clear the search
            </button>
          </p>
        }
      >
        <OptionGrid
          label="Themes"
          class="dock-theme-grid"
          optionClass="dock-theme"
          items={themes()}
          id={theme => theme.id}
          selected={theme => theme.id === shownTheme(dock.model)?.id}
          change={theme => themePreview(dock.model, theme)}
          onPick={(_, byKeyboard) => dock.closeAfterPick(byKeyboard)}
          search={() => search}
          autofocus
        >
          {theme => <ThemeTile theme={theme} />}
        </OptionGrid>
      </Show>
    </div>
  );
}

interface ChoiceListProps {
  control: ChoiceControl;
  onPick: (byKeyboard: boolean) => void;
  class?: string;
  /** Shows the search field on windows wide enough for a keyboard. */
  searchable?: boolean;
  title: string;
  head?: JSX.Element;
  children?: (option: {key: string; label: string}) => JSX.Element;
}

/** The options of one choice as a grid that previews on the canvas. */
function ChoiceList(props: ChoiceListProps) {
  const dock = useDock();
  const [query, setQuery] = createSignal('');
  let search: HTMLInputElement | undefined;
  let panel!: HTMLDivElement;

  const options = createMemo(() => {
    const words = query().trim().toLowerCase();
    return props.control
      .options()
      .filter(option => option.label.toLowerCase().includes(words));
  });
  const firstOption = () => panel.querySelector<HTMLElement>('[role="option"]');

  return (
    <div class="dock-choice" ref={panel}>
      <PanelHead title={props.title} hint={!dock.compact()}>
        {props.head}
        <Show when={props.searchable && !dock.compact()}>
          <SearchField
            ref={element => (search = element)}
            label={`Search ${props.control.options().length} options`}
            value={query()}
            onInput={setQuery}
            onDown={() => firstOption()?.focus()}
            onEnter={() => firstOption()?.click()}
          />
        </Show>
      </PanelHead>
      <Show
        when={options().length > 0}
        fallback={<p class="dock-empty">Nothing matches “{query()}”.</p>}
      >
        <OptionGrid
          label={props.control.label()}
          class={`dock-chip-grid ${props.class ?? ''}`}
          optionClass="dock-chip"
          items={options()}
          id={option => option.key}
          selected={option => option.key === props.control.value()}
          change={option => dock.fields.preview(props.control, option.key)}
          onPick={(_, byKeyboard) => props.onPick(byKeyboard)}
          search={() => search}
          autofocus
        >
          {option =>
            props.children?.(option) ?? (
              <>
                <span class="dock-chip-label">{option.label}</span>
                <CheckIcon />
              </>
            )
          }
        </OptionGrid>
      </Show>
    </div>
  );
}

export function LanguagePanel() {
  const dock = useDock();
  return (
    <Show when={dock.fields.choice('editor.language')}>
      {control => (
        <div class="dock-panel dock-language">
          <ChoiceList
            control={control()}
            title={control().label()}
            searchable
            onPick={dock.closeAfterPick}
          />
        </div>
      )}
    </Show>
  );
}

export function PaddingPanel() {
  const dock = useDock();
  return (
    <Show when={dock.fields.choice('frame.padding')}>
      {control => (
        <div class="dock-panel dock-padding-panel">
          <ChoiceList
            control={control()}
            title={control().label()}
            onPick={dock.closeAfterPick}
          />
        </div>
      )}
    </Show>
  );
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function BackgroundPanel() {
  const dock = useDock();
  const background = () =>
    dock.fields.control('frame.background', 'background');
  const image = () => dock.fields.control('frame.backgroundImage', 'custom');
  const frameVisible = () => dock.fields.control('frame.visible', 'toggle');

  return (
    <div class="dock-panel dock-background">
      <Show when={background()}>
        {control => {
          const swatches = [
            ...control().gradients.map((value, index) => ({
              value,
              name: `Gradient ${index + 1}`,
            })),
            ...control().colors.map(value => ({value, name: value})),
          ];
          return (
            <Show
              when={control().visible()}
              fallback={
                <div class="dock-background-hidden">
                  <p class="dock-empty">
                    The frame is hidden, so there is no background to set.
                  </p>
                  <Show when={frameVisible()}>
                    {toggle => <SwitchRow control={toggle()} />}
                  </Show>
                </div>
              }
            >
              <div class="dock-background-main">
                <PanelHead title={control().label()} hint={!dock.compact()} />
                <OptionGrid
                  label={control().label()}
                  class="dock-swatches"
                  optionClass="dock-swatch"
                  items={swatches}
                  id={swatch => swatch.value}
                  selected={swatch => swatch.value === control().value()}
                  change={swatch => choicePreview(control(), swatch.value)}
                  onPick={() => undefined}
                  autofocus
                >
                  {swatch => (
                    <span
                      class="dock-swatch-fill"
                      style={{background: swatch.value}}
                    >
                      <span class="dock-sr-only">{swatch.name}</span>
                    </span>
                  )}
                </OptionGrid>
              </div>
              <div class="dock-background-side">
                <label class="dock-row dock-color">
                  <span class="dock-row-label">Custom color</span>
                  <input
                    type="color"
                    value={
                      HEX_COLOR.test(control().value())
                        ? control().value()
                        : '#000000'
                    }
                    onInput={e => control().set(e.currentTarget.value)}
                  />
                </label>
                <Show when={image()}>
                  {picker => (
                    <div class="dock-image">
                      <span class="dock-row-label">{picker().label()}</span>
                      <Dynamic component={picker().Control} />
                    </div>
                  )}
                </Show>
              </div>
            </Show>
          );
        }}
      </Show>
    </div>
  );
}

export function FontPanel() {
  const dock = useDock();
  const family = () => dock.fields.choice('font.family');
  const weight = () => dock.fields.choice('font.weight');
  const ligatures = () => dock.fields.control('font.ligatures', 'toggle');
  const isSystemFont = () =>
    !family()
      ?.options()
      .some(option => option.key === family()?.value());

  return (
    <div class="dock-panel dock-font">
      <Show when={family()}>
        {control => (
          <ChoiceList
            control={control()}
            title={control().label()}
            class="dock-font-grid"
            onPick={() => undefined}
          >
            {option => (
              <>
                <span
                  class="dock-chip-label"
                  style={{'font-family': `"${option.label}", monospace`}}
                >
                  {option.label}
                </span>
                <CheckIcon />
              </>
            )}
          </ChoiceList>
        )}
      </Show>
      <div class="dock-font-side">
        <Show when={weight()}>
          {control => <Segmented control={control()} class="dock-row" />}
        </Show>
        <Show when={ligatures()}>
          {control => <SwitchRow control={control()} />}
        </Show>
        <ListRow
          label="System fonts"
          value={isSystemFont() ? dock.fields.fontName() : ''}
          onOpen={() => dock.open({panel: 'font', detail: 'font.system'})}
        />
      </div>
    </div>
  );
}

function Group(props: {id: GroupId}) {
  const dock = useDock();
  return (
    <For each={dock.fields.group(props.id)}>
      {control => <ControlRow control={control} />}
    </For>
  );
}

function Actions() {
  const dock = useDock();
  return (
    <div class="dock-actions-row">
      <button
        type="button"
        class="dock-button"
        onClick={() => dock.stage.randomize()}
      >
        <ShuffleIcon />
        Randomize
      </button>
      <button
        type="button"
        class="dock-button"
        disabled={!dock.stage.canFormat()}
        onClick={() => void dock.stage.format()}
      >
        <WandIcon />
        Format code
      </button>
      <span class="dock-actions-copy">
        <dock.stage.CopyToClipboardButton />
      </span>
      <button
        type="button"
        class="dock-button dock-actions-search"
        onClick={() => dock.open({panel: 'commands'})}
      >
        <SearchIcon />
        Search all options
      </button>
    </div>
  );
}

export function MorePanel() {
  const dock = useDock();
  return (
    <div class="dock-panel dock-more">
      <Show
        when={dock.compact()}
        fallback={
          <div class="dock-groups">
            <For each={GROUPS}>
              {group => (
                <section class="dock-group" aria-label={group.label}>
                  <h2 class="dock-group-title">{group.label}</h2>
                  <Group id={group.id} />
                  <Show when={group.id === 'code'}>
                    <Actions />
                  </Show>
                </section>
              )}
            </For>
          </div>
        }
      >
        <Tabs class="dock-tabs" defaultValue={GROUPS[0].id}>
          <Tabs.List class="dock-tab-list" aria-label="More options">
            <For each={GROUPS}>
              {group => (
                <Tabs.Trigger class="dock-tab" value={group.id}>
                  {group.label}
                </Tabs.Trigger>
              )}
            </For>
          </Tabs.List>
          <For each={GROUPS}>
            {group => (
              <Tabs.Content class="dock-group" value={group.id}>
                <Group id={group.id} />
              </Tabs.Content>
            )}
          </For>
          <Actions />
        </Tabs>
      </Show>
    </div>
  );
}

function BackButton(props: {label: string}) {
  const dock = useDock();
  return (
    <button
      type="button"
      class="dock-button dock-back"
      onClick={() => dock.back()}
    >
      <BackIcon />
      {props.label}
    </button>
  );
}

function WindowStyleDetail() {
  const dock = useDock();
  const accent = () => dock.fields.control('window.accent', 'toggle');
  return (
    <Show when={dock.fields.choice('window.style')}>
      {control => (
        <>
          <ChoiceList
            control={control()}
            title={control().label()}
            class="dock-window-grid"
            head={<BackButton label="More" />}
            onPick={() => undefined}
          >
            {option => (
              <>
                <span class="dock-window-art" inert>
                  <WindowStyleArt type={option.key} />
                </span>
                <span class="dock-chip-label">{option.label}</span>
                <CheckIcon />
              </>
            )}
          </ChoiceList>
          <Show when={accent()}>
            {toggle => (
              <div class="dock-detail-side">
                <ControlRow control={toggle()} />
              </div>
            )}
          </Show>
        </>
      )}
    </Show>
  );
}

function SystemFontsDetail() {
  const dock = useDock();
  return (
    <Show when={dock.fields.choice('font.family')}>
      {control => (
        <div class="dock-system-fonts">
          <PanelHead title="System fonts">
            <BackButton label="Font" />
          </PanelHead>
          <FontSystemPicker
            value={control().value()}
            onChange={control().set}
            onEsc={dock.back}
          />
        </div>
      )}
    </Show>
  );
}

/** A list of options that took over the tray. Picking one goes back. */
export function DetailPanel(props: {detail: DetailId}) {
  const dock = useDock();
  const choice = () =>
    props.detail === 'font.system'
      ? undefined
      : dock.fields.choice(props.detail);

  return (
    <div class="dock-panel dock-detail">
      <Switch>
        <Match when={props.detail === 'font.system'}>
          <SystemFontsDetail />
        </Match>
        <Match when={props.detail === 'window.style'}>
          <WindowStyleDetail />
        </Match>
        <Match when={choice()}>
          {control => (
            <ChoiceList
              control={control()}
              title={control().label()}
              head={<BackButton label="More" />}
              onPick={dock.back}
            />
          )}
        </Match>
      </Switch>
    </div>
  );
}
