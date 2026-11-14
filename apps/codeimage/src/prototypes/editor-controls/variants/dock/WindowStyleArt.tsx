import {getRootEditorStore} from '@codeimage/store/editor';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {TERMINAL_SHADOWS} from '@core/configuration/shadow';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {Suspense} from 'solid-js';
import {Dynamic} from 'solid-js/web';

type WindowType = keyof typeof AVAILABLE_TERMINAL_THEMES.entries;

/** The window header of one style in the current theme, as today's Window popover draws it. */
export function WindowStyleArt(props: {type: string}) {
  const terminal = getTerminalState();
  const editor = getRootEditorStore();
  const entries = AVAILABLE_TERMINAL_THEMES.entries;

  return (
    <Suspense>
      <Dynamic
        component={
          (entries[props.type as WindowType] ?? entries.macOs).component
        }
        lite
        preview={true}
        showTab={true}
        shadow={TERMINAL_SHADOWS.md}
        textColor={terminal.state.textColor}
        background={terminal.state.background}
        accentVisible={terminal.state.accentVisible}
        readonlyTab={true}
        showHeader={true}
        showWatermark={false}
        alternativeTheme={false}
        opacity={100}
        themeId={editor.state.options.themeId}
        showGlassReflection={false}
        borderType={null}
      />
    </Suspense>
  );
}
