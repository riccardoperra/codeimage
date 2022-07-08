import {useI18n} from '@codeimage/locale';
import {copyToClipboard$} from '@codeimage/store/effects/onCopyToClipboard';
import {onThemeChange$} from '@codeimage/store/effects/onThemeChange';
import {setScale} from '@codeimage/store/frame';
import {Box, Button, HStack, PortalHost, SnackbarHost} from '@codeimage/ui';
import {useModality} from '@core/hooks/isMobile';
import {useEffects} from '@core/store/use-effect';
import {initEffects} from '@ngneat/effects';
import {createEffect, createSignal, lazy, on, Show, Suspense} from 'solid-js';
import {canvasToolbar} from './App.css';
import * as styles from './App.css';
import {BottomBar} from './components/BottomBar/BottomBar';
import {Footer} from './components/Footer/Footer';
import {FrameHandler} from './components/Frame/FrameHandler';
import {FrameSkeleton} from './components/Frame/FrameSkeleton';
import {ClipboardIcon} from './components/Icons/Clipboard';
import {ColorSwatchIcon} from './components/Icons/ColorSwatch';
import {KeyboardShortcuts} from './components/KeyboardShortcuts/KeyboardShortcuts';
import {EditorSidebar} from './components/PropertyEditor/EditorSidebar';
import {Canvas} from './components/Scaffold/Canvas/Canvas';
import {Sidebar} from './components/Scaffold/Sidebar/Sidebar';
import {ThemeSwitcher} from './components/ThemeSwitcher/ThemeSwitcher';
import {ExportInNewTabButton} from './components/Toolbar/ExportNewTabButton';
import {ShareButton} from './components/Toolbar/ShareButton';
import {Toolbar} from './components/Toolbar/Toolbar';
import {uiStore} from './state/ui';
import './theme/global.css';

initEffects();

const ManagedFrame = lazy(() =>
  import('./components/Frame/ManagedFrame').then(c => ({
    default: c.ManagedFrame,
  })),
);

export function App() {
  const [frameRef, setFrameRef] = createSignal<HTMLElement>();
  const [portalHostRef, setPortalHostRef] = createSignal<HTMLElement>();
  const modality = useModality();
  const [, {locale}] = useI18n();
  // TODO: currently disabled
  // connectStoreWithQueryParams();
  useEffects([onThemeChange$, copyToClipboard$]);
  createEffect(on(() => uiStore.locale, locale));

  return (
    <>
      <Toolbar canvasRef={frameRef()} />
      <div class={styles.wrapper}>
        <SnackbarHost />

        <Show when={modality === 'full'}>
          <Sidebar position={'left'}>
            <EditorSidebar />
          </Sidebar>
        </Show>

        <PortalHost ref={setPortalHostRef} />

        <Canvas>
          <Show when={modality === 'mobile'}>
            <Box paddingLeft={4} paddingTop={3} paddingRight={4}>
              <HStack spacing={'2'}>
                <Button
                  size={'xs'}
                  variant={'solid'}
                  theme={'secondary'}
                  style={{width: 'auto', height: '30px'}}
                >
                  <ClipboardIcon />
                  <Box marginLeft={1}>Copy</Box>
                </Button>
                <Button
                  size={'xs'}
                  variant={'solid'}
                  theme={'secondary'}
                  style={{width: 'auto', height: '30px'}}
                >
                  <ColorSwatchIcon />
                  <Box marginLeft={1}>Format code</Box>
                </Button>
                <div style={{flex: 1}} />
                <ShareButton showLabel={true} />
                <ExportInNewTabButton />
              </HStack>
            </Box>
          </Show>

          <FrameHandler ref={setFrameRef} onScaleChange={setScale}>
            <Suspense fallback={<FrameSkeleton />}>
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
      </div>
    </>
  );
}

export default App;
