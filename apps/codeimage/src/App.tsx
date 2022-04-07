import {Frame} from './components/Frame/Frame';
import {Canvas} from './components/Scaffold/Canvas/Canvas';
import {Scaffold} from './components/Scaffold/Scaffold';
import {CustomEditor} from './components/CustomEditor/CustomEditor';
import {Toolbar} from './components/Toolbar/Toolbar';
import {Sidebar} from './components/Scaffold/Sidebar/Sidebar';
import {createEffect, createSignal, on, Show} from 'solid-js';
import {ThemeSwitcher} from './components/ThemeSwitcher/ThemeSwitcher';
import {frame$, setScale} from '@codeimage/store/frame';
import {setTabName, terminal$} from '@codeimage/store/terminal';
import {DynamicTerminal} from './components/Terminal/dynamic/DynamicTerminal';
import {Footer} from './components/Footer/Footer';
import {useI18n} from '@codeimage/locale';
import {useModality} from './core/hooks/isMobile';
import {BottomBar} from './components/BottomBar/BottomBar';
import {FrameHandler} from './components/Frame/FrameHandler';
import {NotificationHandler} from './ui/Toast/SnackbarHost';
import ReloadPrompt from './components/PromptUpdate/PromptUpdate';
import {PortalHost} from './ui/PortalHost/PortalHost';
import {useTabIcon} from './hooks/use-tab-icon';
import {KeyboardShortcuts} from './components/KeyboardShortcuts/KeyboardShortcuts';
import {Box} from '@codeimage/ui';
import {fromObservableObject} from './core/hooks/from-observable-object';
import {initEffects} from '@ngneat/effects';
import {onTabNameChange$, onThemeChange$} from '@codeimage/store/effect';
import {uiStore} from './state/ui';
import {useEffects} from './core/store/use-effect';
import {EditorSidebar} from './components/PropertyEditor/EditorSidebar';

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
  useEffects([onTabNameChange$, onThemeChange$]);
  createEffect(on(() => uiStore.locale, locale));

  return (
    <Scaffold>
      <NotificationHandler />
      <ReloadPrompt />

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
