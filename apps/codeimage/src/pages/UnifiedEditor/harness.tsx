import {trackTimelineInput} from '../../components/Animation/timeline/motion';
import {getRootEditorStore} from '@codeimage/store/editor';
import {repositionTooltips} from '@codemirror/view';
import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorSync';
import {getWhatsNew} from '../../state/whats-new';
import {WhatsNewHost} from '../../components/WhatsNew/WhatsNewHost';
import {commandMenu} from './command-menu/state';
import {settings} from './shell/settings-state';
import type {JSX} from 'solid-js';
import {createEffect, createMemo, For, on, Show} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {AgentTools} from './agent-tools/AgentTools';
import {ToolActivity} from './agent-tools/ToolActivity';
import {createAgentTools, createEditorBrief} from './agent-tools/tools';
import {CommandMenu} from './command-menu/CommandMenu';
import {createListedModel} from './command-menu/listed-model';
import {EditorHost} from './EditorHost';
import {LocalAi, localAi} from './local-ai/LocalAi';
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
  const editor = getRootEditorStore();
  createEffect(
    on(
      adapter.snippetId,
      () => {
        commandMenu.close();
        controlOverlay.close();
        localAi.close();
        model.endPreview();
      },
      {defer: true},
    ),
  );
  let page!: HTMLDivElement;

  const side = () =>
    preferences.layout() === 'sidebar' ? preferences.panelSide() : undefined;
  const nav = () =>
    preferences.layout() === 'sidebar' ? preferences.panelNav() : undefined;

  // The sidebar's accordion reads its side from the layout root. The
  // attribute goes on the page below and on the root element the layout
  // renders into it, the one after the header.
  createEffect(() => {
    const value = side();
    preferences.layout();
    preferences.panelNav();
    const root = page.querySelector(':scope > header + *');
    if (!(root instanceof HTMLElement)) return;
    if (value) root.dataset.panelSide = value;
    else delete root.dataset.panelSide;
    const view = editor.activeEditorView();
    if (view)
      queueMicrotask(() => {
        if (editor.activeEditorView() === view) repositionTooltips(view);
      });
  });

  return (
    <>
      <For
        each={model.sections
          .flatMap(section => section.controls)
          .filter(control => control.visible())}
      >
        {control => {
          getWhatsNew().bindLocation(`control:${control.id}`, async () => {
            settings.close();
            // Let Settings return focus before opening a dismissable panel.
            await new Promise<void>(resolve =>
              requestAnimationFrame(() => resolve()),
            );
            return model.controls.reveal(control.id);
          });
          return null;
        }}
      </For>
      <div
        class={`unified-editor ${pageClass}`}
        ref={element => {
          page = element;
          trackTimelineInput(element);
        }}
        data-layout={preferences.layout()}
        data-page-state={pageState().kind}
        data-panel-side={side()}
        data-panel-nav={nav()}
      >
        <Show when={layouts[preferences.layout()]} keyed>
          {layout => {
            // Created outside the JSX: a call in a prop compiles to a getter
            // and would build a new stage on every read.
            const stage = createStage(pageState);
            const listed = createListedModel(model);
            const tools = createAgentTools({
              model,
              listed,
              exporter: stage.exporter,
              pageState,
            });
            const brief = createEditorBrief({model, listed});
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
                <AgentTools tools={tools} />
                <LocalAi
                  tools={tools}
                  brief={brief}
                  compact={stage.compact}
                  pageState={pageState}
                />
              </>
            );
          }}
        </Show>
      </div>
      {/* Outside the layout, so it stays open while the layout under it changes. */}
      <SettingsDialog model={model} />
      <ToolActivity />
      <WhatsNewHost
        quiet={() =>
          !settings.isOpen() && !commandMenu.isOpen() && !localAi.isOpen()
        }
      />
    </>
  );
}

/**
 * The editor in the layout the user chose. The layout, the sidebar's
 * navigation and side, and the theme cards are settings, changed in the
 * settings dialog and command menu.
 */
export function UnifiedEditor(): JSX.Element {
  return (
    <EditorHost>
      <Editor />
    </EditorHost>
  );
}
