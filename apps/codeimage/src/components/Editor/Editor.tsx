import {createSignal, JSXElement} from 'solid-js';
import {Canvas} from '../Scaffold/Canvas/Canvas';
import {Toolbar} from '../Toolbar/Toolbar';
import {FrameHandler} from '../Frame/FrameHandler';
import {Frame} from '../Frame/Frame';
import {DynamicTerminal} from '../Terminal/dynamic/DynamicTerminal';
import {CustomEditor} from '../CustomEditor/CustomEditor';
import {Footer} from '../Footer/Footer';
import {useFrameState} from '../../state/frame';
import {useTerminalState} from '../../state/terminal';

export default function Editor(): JSXElement {
  const [frameRef, setFrameRef] = createSignal<HTMLElement>();
  const frame = useFrameState();
  const terminal = useTerminalState();

  return (
    <>
      <Toolbar canvasRef={frameRef()} />
      <FrameHandler ref={setFrameRef} onScaleChange={frame.setScale}>
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
            onTabChange={terminal.setTabName}
            showHeader={terminal.showHeader}
          >
            <CustomEditor />
          </DynamicTerminal>
        </Frame>
      </FrameHandler>
      <Footer />
    </>
  );
}
