import {getRootEditorStore} from '@codeimage/store/editor';
import type {TerminalState} from '@codeimage/store/editor/model';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {TERMINAL_SHADOWS} from '@core/configuration/shadow';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import type {ParentProps} from 'solid-js';
import {Suspense} from 'solid-js';
import {Dynamic} from 'solid-js/web';

const entries = Object.values(AVAILABLE_TERMINAL_THEMES.entries);

/**
 * A window style drawn by the frame's own renderer, with the current theme
 * colours, as small read-only artwork for pickers.
 */
export function WindowPreview(
  props: ParentProps<{
    style: string;
    surface: TerminalState['surface'];
  }>,
) {
  const terminal = getTerminalState();
  const editor = getRootEditorStore();
  const component = () =>
    (
      entries.find(entry => entry.name === props.style) ??
      AVAILABLE_TERMINAL_THEMES.entries.macOs
    ).component;
  return (
    <Suspense>
      <Dynamic
        component={component()}
        lite
        preview={true}
        surface={props.surface}
        shadow={TERMINAL_SHADOWS.md}
        showTab={true}
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
      >
        {props.children}
      </Dynamic>
    </Suspense>
  );
}
