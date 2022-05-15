import {useI18n} from '@codeimage/locale';
import {connectStoreWithQueryParams} from '@codeimage/store/connect-store-with-query-params';
import {copyToClipboard$} from '@codeimage/store/effects/onCopyToClipboard';
import {onTabNameChange$} from '@codeimage/store/effects/onTabNameChange';
import {onThemeChange$} from '@codeimage/store/effects/onThemeChange';
import {frame$, setScale} from '@codeimage/store/frame';
import {setTabName, terminal$} from '@codeimage/store/terminal';
import {Box, PortalHost, SnackbarHost} from '@codeimage/ui';
import {initEffects} from '@ngneat/effects';
import {createEffect, createSignal, on, Show} from 'solid-js';
import {BottomBar} from './BottomBar/BottomBar';
import {CustomEditor} from './CustomEditor/CustomEditor';
import {Footer} from './Footer/Footer';
import {Frame} from './Frame/Frame';
import {FrameHandler} from './Frame/FrameHandler';
import {KeyboardShortcuts} from './KeyboardShortcuts/KeyboardShortcuts';
import {EditorSidebar} from './PropertyEditor/EditorSidebar';
import {Canvas} from './Scaffold/Canvas/Canvas';
import {Scaffold} from './Scaffold/Scaffold';
import {Sidebar} from './Scaffold/Sidebar/Sidebar';
import {DynamicTerminal} from './Terminal/dynamic/DynamicTerminal';
import {ThemeSwitcher} from './ThemeSwitcher/ThemeSwitcher';
import {Toolbar} from './Toolbar/Toolbar';
import {fromObservableObject} from '../core/hooks/from-observable-object';
import {useModality} from '../core/hooks/isMobile';
import {useEffects} from '../core/store/use-effect';
import {useTabIcon} from '../hooks/use-tab-icon';
import {uiStore} from '@codeimage/store/ui';
import '../theme/global.css';

initEffects();

const App = () => {
  document.querySelector('#launcher')?.remove();
  const [frameRef, setFrameRef] = createSignal<HTMLElement>();
  const [portalHostRef, setPortalHostRef] = createSignal<HTMLElement>();
  const frame = fromObservableObject(frame$);
  const terminal = fromObservableObject(terminal$);
  const modality = useModality();
  const [, {locale}] = useI18n();
  const [tabIcon] = useTabIcon({withDefault: true});
  connectStoreWithQueryParams();
  useEffects([onTabNameChange$, onThemeChange$, copyToClipboard$]);
  createEffect(on(() => uiStore.locale, locale));

  return (
    <Scaffold>
      <SnackbarHost />

      <Show when={modality === 'full'}>
        <Sidebar position={'left'}>
          <EditorSidebar />
        </Sidebar>
      </Show>

      <PortalHost ref={setPortalHostRef} />

      <Canvas>
        <Toolbar canvasRef={frameRef()} />

        <Show when={modality === 'full'}>
          <Box paddingLeft={4} paddingTop={3}>
            <KeyboardShortcuts />
          </Box>
        </Show>

        <FrameHandler ref={setFrameRef} onScaleChange={setScale}>
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
              showGlassReflection={terminal.showGlassReflection}
              tabIcon={tabIcon()?.content}
              showWatermark={terminal.showWatermark}
            >
              <CustomEditor />
            </DynamicTerminal>
          </Frame>
        </FrameHandler>

        <Footer />
      </Canvas>

      <Show
        when={modality === 'full'}
        fallback={<BottomBar portalHostRef={portalHostRef()} />}
      >
        <Sidebar position={'right'}>
          <ThemeSwitcher orientation={'vertical'} />
        </Sidebar>
      </Show>
    </Scaffold>
  );
};

export default App;
