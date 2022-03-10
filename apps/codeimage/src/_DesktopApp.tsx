import {createSignal, JSXElement, lazy, Suspense} from 'solid-js';
import ThemeSwitcher from './components/ThemeSwitcher/ThemeSwitcher';

const LazySidebar = lazy(() => import('./components/Scaffold/Sidebar/Sidebar'));

const LazyEditorSidebar = lazy(
  () => import('./components/LeftSidebar/EditorSidebar'),
);

const LazyEditor = lazy(() => import('./components/Editor/Editor'));

export default function DesktopApp(): JSXElement {
  const [, setPortalHostRef] = createSignal<HTMLElement>();

  return (
    <>
      <LazySidebar>
        <LazyEditorSidebar />
      </LazySidebar>

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

      <Suspense>
        <LazyEditor />
      </Suspense>

      <LazySidebar>
        <ThemeSwitcher orientation={'vertical'} />
      </LazySidebar>
    </>
  );
}
