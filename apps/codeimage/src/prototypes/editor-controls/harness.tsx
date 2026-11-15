import {WhatsNewHost} from '../../components/WhatsNew/WhatsNewHost';
import {commandMenu} from './command-menu/state';
import {settings} from './shell/settings-state';
import type {JSX} from 'solid-js';
import {createEffect, Show} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {CommandMenu} from './command-menu/CommandMenu';
import {EditorHost} from './EditorHost';
import {createEditorControlsModel} from './model';
import {layouts} from './registry';
import {Header} from './shell/Header';
import {page as pageClass} from './shell/header.css';
import {preferences} from './shell/preferences';
import {SettingsDialog} from './shell/SettingsDialog';
import {createStage} from './stage';
import type {ThemePickerSlotProps} from './theme-styles/ThemePicker';
import {ThemePicker} from './theme-styles/ThemePicker';
import {themeStyle} from './theme-styles/style';

export {PickerRoute as PrototypeRoute} from './picker/PickerRoute';

function Editor() {
  const model = createEditorControlsModel();
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
        class={`proto-variant ${pageClass}`}
        ref={page}
        data-layout={preferences.layout()}
        data-inspector-side={side()}
      >
        <Show when={layouts[preferences.layout()]} keyed>
          {layout => {
            // Created outside the JSX: a call in a prop compiles to a getter
            // and would build a new stage on every read.
            const stage = createStage();
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
                  stage={stage}
                  ThemePicker={BoundThemePicker}
                />
                {/* One menu for every layout, bound to the shortcut here. */}
                <CommandMenu model={model} stage={stage} />
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
 * The editor in the layout the user chose, with no prototype chrome: the
 * layout, the Inspector's side and the theme cards are settings, changed in
 * the settings dialog and the command menu. The `v` and `t` URL parameters
 * still pick a layout and a theme card style for a link.
 */
export function UnifiedEditor(): JSX.Element {
  return (
    <EditorHost>
      <Editor />
    </EditorHost>
  );
}
