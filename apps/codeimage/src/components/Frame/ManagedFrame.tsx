import {getActiveEditorStore} from '@codeimage/store/editor/createActiveEditor';
import {getRootEditorStore} from '@codeimage/store/editor/createEditors';
import {frame$} from '@codeimage/store/frame';
import {terminal$} from '@codeimage/store/terminal';
import {LoadingOverlay} from '@codeimage/ui';
import {fromObservableObject} from '@core/hooks/from-observable-object';
import {Show} from 'solid-js';
import {CustomEditor} from '../CustomEditor/CustomEditor';
import {DynamicTerminal} from '../Terminal/DynamicTerminal/DynamicTerminal';
import {Frame} from './Frame';

export function ManagedFrame() {
  const frame = fromObservableObject(frame$);
  const terminal = fromObservableObject(terminal$);
  const editor = getRootEditorStore();
  const {ready} = getRootEditorStore();

  return (
    <Show
      when={ready()}
      fallback={
        <div style={{height: '400px', width: '600px'}}>
          <LoadingOverlay overlay={true} size={'lg'} />
        </div>
      }
    >
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
