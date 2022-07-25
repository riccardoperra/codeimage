import {useI18n} from '@codeimage/locale';
import {
  createEditorSyncAdapter,
  getEditorSyncAdapter,
} from '@codeimage/store/editor/createEditorInit';
import {getFrameState} from '@codeimage/store/editor/frame';
import {uiStore} from '@codeimage/store/ui';
import {Box, Button, HStack, PortalHost, SnackbarHost} from '@codeimage/ui';
import {useModality} from '@core/hooks/isMobile';
import {
  createEffect,
  createSignal,
  lazy,
  on,
  onCleanup,
  onMount,
  Show,
  Suspense,
} from 'solid-js';
import {BottomBar} from '../../components/BottomBar/BottomBar';
import {Footer} from '../../components/Footer/Footer';
import {FrameHandler} from '../../components/Frame/FrameHandler';
import {FrameSkeleton} from '../../components/Frame/FrameSkeleton';
import {ClipboardIcon} from '../../components/Icons/Clipboard';
import {KeyboardShortcuts} from '../../components/KeyboardShortcuts/KeyboardShortcuts';
import {EditorSidebar} from '../../components/PropertyEditor/EditorSidebar';
import {Canvas} from '../../components/Scaffold/Canvas/Canvas';
import {Sidebar} from '../../components/Scaffold/Sidebar/Sidebar';
import {ThemeSwitcher} from '../../components/ThemeSwitcher/ThemeSwitcher';
import {ExportInNewTabButton} from '../../components/Toolbar/ExportNewTabButton';
import {ShareButton} from '../../components/Toolbar/ShareButton';
import {Toolbar} from '../../components/Toolbar/Toolbar';
import * as styles from './App.css';

const ManagedFrame = lazy(() =>
  import('../../components/Frame/ManagedFrame').then(c => ({
    default: c.ManagedFrame,
  })),
);

export function App() {
  const [frameRef, setFrameRef] = createSignal<HTMLElement>();
  const [portalHostRef, setPortalHostRef] = createSignal<HTMLElement>();
  const modality = useModality();
  const [, {locale}] = useI18n();
  const frameStore = getFrameState();
  createEffect(on(() => uiStore.locale, locale));

  return (
    <>
      <Toolbar canvasRef={frameRef()} />
      <div class={styles.wrapper}>
        <Show when={modality === 'full'}>
          <Sidebar position={'left'}>
            <EditorSidebar />
          </Sidebar>
        </Show>

        <PortalHost ref={setPortalHostRef} />

        <Canvas>
          <Box paddingLeft={4} paddingTop={3}>
            <HStack spacing={'2'}>
              <Show when={modality === 'full'}>
                <KeyboardShortcuts />
              </Show>
            </HStack>
          </Box>

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
                <div style={{flex: 1}} />
                <ShareButton showLabel={true} />
                <ExportInNewTabButton />
              </HStack>
            </Box>
          </Show>

          <FrameHandler ref={setFrameRef} onScaleChange={frameStore.setScale}>
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
