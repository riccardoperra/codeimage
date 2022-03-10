import {createSignal, JSXElement, lazy} from 'solid-js';
import {useFrameState} from './state/frame';
import {useTerminalState} from './state/terminal';
import {Toolbar} from './components/Toolbar/Toolbar';
import {Canvas} from './components/Scaffold/Canvas/Canvas';
import {FrameHandler} from './components/Frame/FrameHandler';
import {Frame} from './components/Frame/Frame';
import {DynamicTerminal} from './components/Terminal/dynamic/DynamicTerminal';
import {CustomEditor} from './components/CustomEditor/CustomEditor';
import {Footer} from './components/Footer/Footer';

const LazyBottomBar = lazy(() => import('./components/BottomBar/BottomBar'));

export default function MobileApp(): JSXElement {
  const [frameRef, setFrameRef] = createSignal<HTMLElement>();
  const [portalHostRef, setPortalHostRef] = createSignal<HTMLElement>();
  const frame = useFrameState();
  const terminal = useTerminalState();

  return (
    <>
      <div
        ref={setPortalHostRef}
        id={'portal-host'}
        style={{
          position: 'relative',
          width: '0px',
          height: '0px',
          // eslint-disable-next-line solid/style-prop
          'z-index': 10,
        }}
      />
      <Canvas>
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
      </Canvas>
      <LazyBottomBar portalHostRef={portalHostRef()} />
    </>
  );
}
