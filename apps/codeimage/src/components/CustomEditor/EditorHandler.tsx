import {Frame} from '../Frame/Frame';
import {DynamicTerminal} from '../Terminal/dynamic/DynamicTerminal';
import {FrameHandler} from '../Frame/FrameHandler';
import {fromObservableObject} from '../../core/hooks/from-observable-object';
import {useTabIcon} from '../../hooks/use-tab-icon';
import {frame$, setScale} from '@codeimage/store/frame';
import {setTabName, terminal$} from '@codeimage/store/terminal';
import {lazy, Setter} from 'solid-js';

export interface EditorHandlerProps {
  frameRef: Setter<HTMLElement>;
}

const CustomEditor = lazy(() => {
  return import('./CustomEditor').then(m => ({default: m.CustomEditor}));
});

export default function EditorHandler(props: EditorHandlerProps) {
  const frame = fromObservableObject(frame$);
  const terminal = fromObservableObject(terminal$);
  const [tabIcon] = useTabIcon({withDefault: true});

  return (
    <FrameHandler ref={props.frameRef} onScaleChange={setScale}>
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
          onTabChange={setTabName}
          showHeader={terminal.showHeader}
          tabIcon={tabIcon()?.content}
          showWatermark={terminal.showWatermark}
        >
          <CustomEditor />
        </DynamicTerminal>
      </Frame>
    </FrameHandler>
  );
}
