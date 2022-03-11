import {createSignal, JSXElement, lazy} from 'solid-js';
import ThemeSwitcher from './components/ThemeSwitcher/ThemeSwitcher';
import Sidebar from './components/Scaffold/Sidebar/Sidebar';
import EditorSidebar from './components/LeftSidebar/EditorSidebar';

const LazyEditor = lazy(() => import('./components/Editor/Editor'));

export default function DesktopApp(): JSXElement {
  const [, setPortalHostRef] = createSignal<HTMLElement>();

  return (
    <>
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
    </>
  );
}
