import {getActiveEditorStore} from '@codeimage/store/editor/createActiveEditor';
import {getRootEditorStore} from '@codeimage/store/editor/createEditors';
import {getFrameState} from '@codeimage/store/frame/createFrame';
import {terminal$} from '@codeimage/store/terminal';
import {fromObservableObject} from '@core/hooks/from-observable-object';
import {lazy, Show} from 'solid-js';
import {DynamicTerminal} from '../Terminal/DynamicTerminal/DynamicTerminal';
import {Frame} from './Frame';

const CustomEditor = lazy(() => import('../CustomEditor/CustomEditor'));

export function ManagedFrame() {
  const frame = getFrameState().store;
  const terminal = fromObservableObject(terminal$);
  const editor = getRootEditorStore();

  return (
    <Frame
      radius={0}
      padding={frame.padding}
      background={frame.background}
      opacity={frame.opacity}
      visible={frame.visible}
    >
      <DynamicTerminal
        type={terminal.type}
        readonlyTab={false}
        tabName={terminal.tabName}
        showTab={true}
        shadow={terminal.shadow}
        background={terminal.background}
        accentVisible={terminal.accentVisible}
        darkMode={terminal.darkMode}
        textColor={terminal.textColor}
        showHeader={terminal.showHeader}
        showGlassReflection={terminal.showGlassReflection}
        showWatermark={terminal.showWatermark}
        opacity={terminal.opacity}
        alternativeTheme={terminal.alternativeTheme}
        themeId={editor.options.themeId}
      >
        <Show when={getActiveEditorStore().editor()}>
          <CustomEditor />
        </Show>
      </DynamicTerminal>
    </Frame>
  );
}
