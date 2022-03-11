import {createSignal, JSXElement, lazy, Suspense} from 'solid-js';
import ThemeSwitcher from './components/ThemeSwitcher/ThemeSwitcher';
import {LoadingOverlay} from './components/LoadingOverlay/LoadingOverlay';
import Sidebar from './components/Scaffold/Sidebar/Sidebar';
import EditorSidebar from './components/LeftSidebar/EditorSidebar';

const LazyEditor = lazy(() => import('./components/Editor/Editor'));

export default function DesktopApp(): JSXElement {
  const [, setPortalHostRef] = createSignal<HTMLElement>();

  return (
    <>
      <Suspense
        fallback={<LoadingOverlay overlay={true} width={128} height={128} />}
      >
        <Sidebar>
          <EditorSidebar />
        </Sidebar>

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

        <LazyEditor />

        <Sidebar>
          <ThemeSwitcher orientation={'vertical'} />
        </Sidebar>
      </Suspense>
    </>
  );
}
