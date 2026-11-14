import type {JSX} from 'solid-js';
import {createSignal, onCleanup, onMount, Show} from 'solid-js';
import {CodeImageLogoV2} from '../../../../components/Icons/CodeImageLogoV2';
import {ToolbarSettingsButton} from '../../../../components/Toolbar/ToolbarSettings';
import type {VariantMeta, VariantProps} from '../../contract';
import type {Action} from './commands';
import type {DockApi} from './context';
import {createMediaQuery, DockContext, isKeyboardClick} from './context';
import {Segmented} from './controls';
import './dock.css';
import type {PanelId, View} from './fields';
import {createFields} from './fields';
import {CodeIcon, PaddingIcon, SearchIcon, SlidersIcon} from './icons';
import {createPreviewSession, shownTheme} from './preview';
import {tokens} from './tokens.css';
import {Tray} from './Tray';

export const meta: VariantMeta = {
  name: 'Dock',
  axis: 'Interaction model: a dock of six controls, trays that preview, and a command menu',
};

const isApple = /Mac|iPhone|iPad/.test(navigator.platform);

interface DockItemProps {
  panel: PanelId;
  label: string;
  value?: string;
  art?: JSX.Element;
  class?: string;
  onToggle: (panel: PanelId, event: MouseEvent) => void;
  open: boolean;
}

function DockItem(props: DockItemProps) {
  return (
    <button
      type="button"
      class={`dock-item ${props.class ?? ''}`}
      data-panel={props.panel}
      aria-haspopup="dialog"
      aria-expanded={props.open}
      onClick={event => props.onToggle(props.panel, event)}
    >
      <Show when={props.art}>
        <span class="dock-item-art">{props.art}</span>
      </Show>
      <span class="dock-item-text">
        <span class="dock-item-label">{props.label}</span>
        <Show when={props.value}>
          <span class="dock-item-value">{props.value}</span>
        </Show>
      </span>
    </button>
  );
}

export default function Dock(props: VariantProps) {
  const fields = createFields(props.model);
  const compact = createMediaQuery('(max-width: 767px)');
  const canHover = createMediaQuery('(hover: hover) and (pointer: fine)');

  const [view, setView] = createSignal<View>();
  const [previewKey, setPreviewKey] = createSignal<string>();
  const [instant, setInstant] = createSignal(false);
  const session = createPreviewSession(setPreviewKey);

  let bar: HTMLDivElement | undefined;
  let exportSlot: HTMLDivElement | undefined;
  let copySlot: HTMLSpanElement | undefined;
  let trigger: HTMLElement | undefined;

  const open = (next: View) => {
    session.cancel();
    setView(next);
  };
  const close = () => {
    session.cancel();
    setView(undefined);
  };

  const dock: DockApi = {
    model: props.model,
    stage: props.stage,
    fields,
    session,
    previewKey,
    view,
    compact,
    open,
    close,
    back: () => {
      const current = view();
      if (current?.detail) open({panel: current.panel});
    },
    keep: change => {
      session.preview(change);
      session.commit();
    },
    closeAfterPick: byKeyboard => {
      if (byKeyboard || canHover()) close();
    },
  };

  const toggle = (panel: PanelId, event: MouseEvent) => {
    if (view()?.panel === panel) {
      close();
      return;
    }
    if (event.currentTarget instanceof HTMLElement) {
      trigger = event.currentTarget;
    }
    setInstant(isKeyboardClick(event));
    open({panel});
  };

  // Switching variants unmounts the dock with a preview still on the canvas.
  onCleanup(session.cancel);

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = isApple ? event.metaKey : event.ctrlKey;
      if (!modifier || event.altKey || event.shiftKey) return;
      if (event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      event.stopPropagation();
      if (view()?.panel === 'commands') {
        close();
        return;
      }
      if (!view() && document.activeElement instanceof HTMLElement) {
        trigger = document.activeElement;
      }
      setInstant(true);
      open({panel: 'commands'});
    };
    // Capture, so that the code editor does not take the key first.
    window.addEventListener('keydown', onKeyDown, true);
    onCleanup(() => window.removeEventListener('keydown', onKeyDown, true));
  });

  // The production buttons own the export dialog and the clipboard call, so
  // the command menu presses them. The frame lets the tray close first.
  const press = (slot: () => HTMLElement | undefined) => () =>
    requestAnimationFrame(() => slot()?.querySelector('button')?.click());

  const actions = (): Action[] => [
    {label: 'Export image…', note: 'Ctrl S', run: press(() => exportSlot)},
    {label: 'Copy image to clipboard', run: press(() => copySlot)},
    {label: 'Randomize theme and style', run: props.stage.randomize},
    ...(props.stage.canFormat()
      ? [{label: 'Format code', run: () => void props.stage.format()}]
      : []),
  ];

  const isOpen = (panel: PanelId) => view()?.panel === panel;
  const optionLabel = (id: Parameters<typeof fields.choice>[0]) => {
    const choice = fields.choice(id);
    return choice?.options().find(option => option.key === choice.value())
      ?.label;
  };
  const background = () => fields.control('frame.background', 'background');
  const padding = () => fields.choice('frame.padding');
  const label = (id: Parameters<typeof fields.choice>[0], fallback: string) =>
    props.model.control(id)?.label() ?? fallback;

  return (
    <DockContext.Provider value={dock}>
      <div
        class={`dock-root ${tokens}`}
        data-panel={view()?.panel}
        data-compact={compact() ? '' : undefined}
      >
        <main class="dock-stage">
          <CodeImageLogoV2 class="dock-brand" aria-label="CodeImage" />
          <div class="dock-menu">
            <ToolbarSettingsButton />
          </div>
          <div class="dock-canvas">
            <props.stage.Canvas />
          </div>
        </main>

        <Tray
          actions={actions()}
          bar={() => bar}
          trigger={() => trigger}
          instant={instant()}
        />

        <div class="dock-bar-slot">
          <div
            ref={bar}
            class="dock-bar"
            role="toolbar"
            aria-label="Editor controls"
          >
            <DockItem
              panel="themes"
              label={label('editor.theme', 'Theme')}
              value={shownTheme(props.model)?.name}
              open={isOpen('themes')}
              onToggle={toggle}
              art={
                <span
                  class="dock-art-theme"
                  style={{
                    background: shownTheme(props.model)?.colors.background,
                  }}
                >
                  <span
                    style={{
                      background: shownTheme(props.model)?.colors.window,
                    }}
                  />
                </span>
              }
            />
            <DockItem
              panel="background"
              label={label('frame.background', 'Background')}
              open={isOpen('background')}
              onToggle={toggle}
              art={
                <span
                  class="dock-art-fill"
                  data-hidden={background()?.visible() ? undefined : ''}
                  style={{background: background()?.value()}}
                />
              }
            />
            <Show when={padding()}>
              {control => (
                <Segmented
                  control={control()}
                  class="dock-item dock-bar-padding"
                />
              )}
            </Show>
            <DockItem
              panel="padding"
              class="dock-bar-padding-button"
              label={label('frame.padding', 'Padding')}
              value={optionLabel('frame.padding')}
              open={isOpen('padding')}
              onToggle={toggle}
              art={<PaddingIcon />}
            />
            <DockItem
              panel="language"
              label={label('editor.language', 'Language')}
              value={optionLabel('editor.language')}
              open={isOpen('language')}
              onToggle={toggle}
              art={<CodeIcon />}
            />
            <DockItem
              panel="font"
              label={label('font.family', 'Font')}
              value={fields.fontName()}
              open={isOpen('font')}
              onToggle={toggle}
              art={
                <span
                  class="dock-art-font"
                  style={{'font-family': `"${fields.fontName()}", monospace`}}
                >
                  Aa
                </span>
              }
            />
            <span class="dock-separator" role="separator" />
            <DockItem
              panel="more"
              label="More"
              open={isOpen('more')}
              onToggle={toggle}
              art={<SlidersIcon />}
            />
            <button
              type="button"
              class="dock-item dock-bar-search"
              aria-label="Search themes and options"
              aria-haspopup="dialog"
              aria-expanded={isOpen('commands')}
              onClick={event => toggle('commands', event)}
            >
              <SearchIcon />
              <kbd class="dock-kbd">{isApple ? '⌘K' : 'Ctrl K'}</kbd>
            </button>
            <span class="dock-separator" role="separator" />
            <span class="dock-bar-copy" ref={copySlot} onClick={close}>
              <props.stage.CopyToClipboardButton />
            </span>
            <div class="dock-bar-export" ref={exportSlot} onClick={close}>
              <props.stage.ExportButton />
            </div>
          </div>
        </div>
      </div>
    </DockContext.Provider>
  );
}
