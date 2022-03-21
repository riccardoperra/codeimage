import {Canvas} from './components/Scaffold/Canvas/Canvas';
import {Scaffold} from './components/Scaffold/Scaffold';
import {Toolbar} from './components/Toolbar/Toolbar';
import {Sidebar} from './components/Scaffold/Sidebar/Sidebar';
import {createEffect, createSignal, lazy, on, Show, Suspense} from 'solid-js';
import {ThemeSwitcher} from './components/ThemeSwitcher/ThemeSwitcher';
import {Footer} from './components/Footer/Footer';
import {useI18n} from '@codeimage/locale';
import {useModality} from './core/hooks/isMobile';
import {BottomBar} from './components/BottomBar/BottomBar';
import {EditorSidebar} from './components/LeftSidebar/EditorSidebar';
import {NotificationHandler} from './components/ui/Toast/SnackbarHost';
import ReloadPrompt from './components/PromptUpdate/PromptUpdate';
import {PortalHost} from './components/ui/PortalHost/PortalHost';
import {KeyboardShortcuts} from './components/KeyboardShortcuts/KeyboardShortcuts';
import {Box} from './components/ui/Box/Box';
import {initEffects, registerEffects} from '@ngneat/effects';
import {onTabNameChange$, onThemeChange$} from '@codeimage/store/effect';
import {uiStore} from './state/ui';

initEffects();
registerEffects([onTabNameChange$, onThemeChange$]);

const EditorHandler = lazy(async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return import('./components/CustomEditor/EditorHandler');
});

const App = () => {
  document.querySelector('#launcher')?.remove();
  const [frameRef, setFrameRef] = createSignal<HTMLElement>();
  const [portalHostRef, setPortalHostRef] = createSignal<HTMLElement>();
  const modality = useModality();
  const [, {locale}] = useI18n();

  createEffect(on(() => uiStore.locale, locale));

  return (
    <Scaffold>
      <NotificationHandler />
      <ReloadPrompt />
      <Show when={modality === 'full'}>
        <Sidebar>
          <EditorSidebar />
        </Sidebar>
      </Show>

      <PortalHost ref={setPortalHostRef} />

      <Canvas>
        <Toolbar canvasRef={frameRef()} />

        <Show when={modality === 'full'}>
          <Box paddingLeft={'4'} paddingTop={'3'}>
            <KeyboardShortcuts />
          </Box>
        </Show>

        <Suspense>
          <EditorHandler frameRef={setFrameRef} />
        </Suspense>

        <Footer />
      </Canvas>

      {modality === 'mobile' ? (
        <BottomBar portalHostRef={portalHostRef()} />
      ) : (
        <Sidebar>
          <ThemeSwitcher orientation={'vertical'} />
        </Sidebar>
      )}
    </Scaffold>
  );
};

export default App;
