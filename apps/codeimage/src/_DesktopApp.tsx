import {createSignal, JSXElement, lazy, Suspense} from 'solid-js';
import Sidebar from './components/Scaffold/Sidebar/Sidebar';
import {Canvas} from './components/Scaffold/Canvas/Canvas';

const LazyEditorSidebar = lazy(
  () => import('./components/LeftSidebar/EditorSidebar'),
);

const LazyEditor = lazy(() => import('./components/Editor/Editor'));

const LazyThemeSwitcher = lazy(
  () => import('./components/ThemeSwitcher/ThemeSwitcher'),
);

export default function DesktopApp(): JSXElement {
  const [, setPortalHostRef] = createSignal<HTMLElement>();

  return (
    <>
      <Sidebar>
        <Suspense
          fallback={
            <div class="loading-wrapper">
              <div class="title-block">
                <div class="loading content"></div>
                <div class="loading content last-row"></div>
              </div>
              <div class="title-block">
                <div class="loading title"></div>
                <div class="loading content"></div>
                <div class="loading content last-row"></div>
              </div>
              <div class="list-block">
                <div class="loading content line-item"></div>
                <div class="loading content line-item-last"></div>
              </div>
            </div>
          }
        >
          <LazyEditorSidebar />
        </Suspense>
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

      <Canvas>
        <Suspense
          fallback={
            <div class="loading-wrapper">
              <div class="title-block">
                <div class="loading content"></div>
                <div class="loading content last-row"></div>
              </div>
              <div class="title-block">
                <div class="loading title"></div>
                <div class="loading content"></div>
                <div class="loading content last-row"></div>
              </div>
              <div class="list-block">
                <div class="loading content line-item"></div>
                <div class="loading content line-item-last"></div>
              </div>
            </div>
          }
        >
          <LazyEditor />
        </Suspense>
      </Canvas>

      <Sidebar>
        <Suspense
          fallback={
            <div class="loading-wrapper">
              <div class="title-block">
                <div class="loading content"></div>
                <div class="loading content last-row"></div>
              </div>
              <div class="title-block">
                <div class="loading title"></div>
                <div class="loading content"></div>
                <div class="loading content last-row"></div>
              </div>
              <div class="list-block">
                <div class="loading content line-item"></div>
                <div class="loading content line-item-last"></div>
              </div>
            </div>
          }
        >
          <LazyThemeSwitcher orientation={'vertical'} />
        </Suspense>
      </Sidebar>
    </>
  );
}
