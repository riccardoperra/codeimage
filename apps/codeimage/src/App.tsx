import {useI18n} from '@codeimage/locale';
import {copyToClipboard$} from '@codeimage/store/effects/onCopyToClipboard';
import {onThemeChange$} from '@codeimage/store/effects/onThemeChange';
import {setScale} from '@codeimage/store/frame';
import {Box, LoadingOverlay, PortalHost, SnackbarHost} from '@codeimage/ui';
import {useModality} from '@core/hooks/isMobile';
import {useEffects} from '@core/store/use-effect';
import {initEffects} from '@ngneat/effects';
import {createEffect, createSignal, on, Show, Suspense} from 'solid-js';
import {BottomBar} from './components/BottomBar/BottomBar';
import {Footer} from './components/Footer/Footer';
import {FrameHandler} from './components/Frame/FrameHandler';
import {ManagedFrame} from './components/Frame/ManagedFrame';
import {KeyboardShortcuts} from './components/KeyboardShortcuts/KeyboardShortcuts';
import {EditorSidebar} from './components/PropertyEditor/EditorSidebar';
import {SidebarPopoverHost} from './components/PropertyEditor/SidebarPopoverHost';
import {Canvas} from './components/Scaffold/Canvas/Canvas';
import {Scaffold} from './components/Scaffold/Scaffold';
import {Sidebar} from './components/Scaffold/Sidebar/Sidebar';
import {ThemeSwitcher} from './components/ThemeSwitcher/ThemeSwitcher';
import {Toolbar} from './components/Toolbar/Toolbar';
import {uiStore} from './state/ui';
import './theme/global.css';

initEffects();

export function App() {
  document.querySelector('#launcher')?.remove();
  const [frameRef, setFrameRef] = createSignal<HTMLElement>();
  const [portalHostRef, setPortalHostRef] = createSignal<HTMLElement>();
  const modality = useModality();
  const [, {locale}] = useI18n();

  // TODO: currently disabled
  // connectStoreWithQueryParams();
  useEffects([onThemeChange$, copyToClipboard$]);
  createEffect(on(() => uiStore.locale, locale));

  return (
    <Scaffold>
      <PortalHost id={'floating-portal-popover'} />
      <SidebarPopoverHost />
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
          <Suspense
            fallback={
              <div style={{height: '400px', width: '600px', background: 'red'}}>
                <LoadingOverlay overlay={true} size={'lg'} />
              </div>
            }
          >
            <ManagedFrame />
          </Suspense>
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
}

export default App;
