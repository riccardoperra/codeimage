import {Sidebar} from './components/Scaffold/Sidebar/Sidebar';
import {createSignal, JSXElement, lazy, Suspense} from 'solid-js';
import {Toolbar} from './components/Toolbar/Toolbar';
import {Box} from './components/ui/Box/Box';
import {KeyboardShortcuts} from './components/KeyboardShortcuts/KeyboardShortcuts';
import {Footer} from './components/Footer/Footer';
import {Canvas} from './components/Scaffold/Canvas/Canvas';

const EditorSidebar = lazy(() => {
  return import('./components/LeftSidebar/EditorSidebar').then(e => ({
    default: e.EditorSidebar,
  }));
});

const EditorHandler = lazy(
  () => import('./components/CustomEditor/EditorHandler'),
);

const ThemeSwitcher = lazy(() => {
  return import('./components/ThemeSwitcher/ThemeSwitcher').then(e => ({
    default: e.ThemeSwitcher,
  }));
});

export default function DesktopView(): JSXElement {
  const [frameRef, setFrameRef] = createSignal<HTMLElement>();

  return (
    <>
      <Sidebar>
        <Suspense>
          <EditorSidebar />
        </Suspense>

        <Canvas>
          <Toolbar canvasRef={frameRef()} />

          <Box paddingLeft={'4'} paddingTop={'3'}>
            <KeyboardShortcuts />
          </Box>

          <Suspense>
            <EditorHandler frameRef={setFrameRef} />
          </Suspense>

          <Suspense>
            <ThemeSwitcher orientation={'vertical'} />
          </Suspense>

          <Footer />
        </Canvas>
      </Sidebar>
    </>
  );
}
