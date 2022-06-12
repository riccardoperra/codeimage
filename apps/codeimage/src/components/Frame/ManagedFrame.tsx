import {getActiveEditorStore} from '@codeimage/store/editor/createActiveEditor';
import {getRootEditorStore} from '@codeimage/store/editor/createEditors';
import {frame$} from '@codeimage/store/frame';
import {terminal$} from '@codeimage/store/terminal';
import {fromObservableObject} from '@core/hooks/from-observable-object';
import {lazy, Show} from 'solid-js';
import {DynamicTerminal} from '../Terminal/DynamicTerminal/DynamicTerminal';
import {Frame} from './Frame';
import {FrameSkeleton} from './FrameSkeleton';

const CustomEditor = lazy(() => {
  return import('../CustomEditor/CustomEditor');
});

export function ManagedFrame() {
  const frame = fromObservableObject(frame$);
  const terminal = fromObservableObject(terminal$);
  const editor = getRootEditorStore();
  const {ready} = getRootEditorStore();

  return (
    <Show when={ready()} fallback={<FrameSkeleton />}>
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
    </Show>
  );
}
