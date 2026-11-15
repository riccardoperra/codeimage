import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorSync';
import {WhatsNewHost} from '../../components/WhatsNew/WhatsNewHost';
import {commandMenu} from './command-menu/state';
import {settings} from './shell/settings-state';
import type {JSX} from 'solid-js';
import {createEffect, createMemo, on, Show} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {AgentTools} from './agent-tools/AgentTools';
import {CommandMenu} from './command-menu/CommandMenu';
import {EditorHost} from './EditorHost';
import {createEditorControlsModel} from './model';
import {controlOverlay} from './controls/ControlOverlay';
import {resolveEditorPageState} from './page-state';
import {layouts} from './registry';
import {Header} from './shell/Header';
import {page as pageClass} from './shell/header.css';
import {preferences} from './shell/preferences';
import {SettingsDialog} from './shell/SettingsDialog';
import {createStage} from './stage';
import type {ThemePickerSlotProps} from './theme-styles/ThemePicker';
import {ThemePicker} from './theme-styles/ThemePicker';
import {themeStyle} from './theme-styles/style';

function Editor() {
  const adapter = getEditorSyncAdapter()!;
  const pageState = createMemo(() =>
    resolveEditorPageState(
      adapter.snippetId(),
      adapter.loadedSnippet.state,
      adapter.readOnly(),
    ),
  );
  const model = createEditorControlsModel();
  createEffect(
    on(
      adapter.snippetId,
      () => {
        commandMenu.close();
        controlOverlay.close();
        model.endPreview();
      },
      {defer: true},
    ),
  );
  let page!: HTMLDivElement;

  const side = () =>
    preferences.layout() === 'inspector'
      ? preferences.inspectorSide()
      : undefined;

  // The Inspector reads its side from the layout root. The attribute goes on
  // the page below and on the root element the layout renders into it, the
  // one after the header.
  createEffect(() => {
    const value = side();
    preferences.layout();
    const root = page.querySelector(':scope > header + *');
    if (!(root instanceof HTMLElement)) return;
    if (value) root.dataset.inspectorSide = value;
    else delete root.dataset.inspectorSide;
  });

  return (
    <>
      <div
        class={`unified-editor ${pageClass}`}
        ref={page}
        data-layout={preferences.layout()}
        data-page-state={pageState().kind}
        data-inspector-side={side()}
      >
        <Show when={layouts[preferences.layout()]} keyed>
          {layout => {
            // Created outside the JSX: a call in a prop compiles to a getter
            // and would build a new stage on every read.
            const stage = createStage(pageState);
            const BoundThemePicker = (slot: ThemePickerSlotProps) => (
              <ThemePicker
                {...slot}
                model={model}
                stage={stage}
                style={themeStyle()}
              />
            );
            return (
              <>
                {/* Here and not in the layouts, so that it sits at one place in all of them. */}
                <Header stage={stage} />
                <Dynamic
                  component={layout.component}
                  model={model}
                  pageState={pageState}
                  stage={stage}
                  ThemePicker={BoundThemePicker}
                />
                {/* One menu for every layout, bound to the shortcut here. */}
                <CommandMenu
                  model={model}
                  stage={stage}
                  pageState={pageState}
                />
                <AgentTools model={model} stage={stage} pageState={pageState} />
              </>
            );
          }}
        </Show>
      </div>
      {/* Outside the layout, so it stays open while the layout under it changes. */}
      <SettingsDialog model={model} />
      <WhatsNewHost quiet={() => !settings.isOpen() && !commandMenu.isOpen()} />
    </>
  );
}

/**
 * The editor in the layout the user chose. The layout, Inspector side and
 * theme cards are settings, changed in the settings dialog and command menu.
 */
export function UnifiedEditor(): JSX.Element {
  return (
    <EditorHost>
      <Editor />
    </EditorHost>
  );
}
