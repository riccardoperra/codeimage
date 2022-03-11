import {createSignal, JSXElement, lazy, Suspense} from 'solid-js';
import {LoadingOverlay} from './components/LoadingOverlay/LoadingOverlay';
import BottomBar from './components/BottomBar/BottomBar';
import {Canvas} from './components/Scaffold/Canvas/Canvas';

const LazyEditor = lazy(() => import('./components/Editor/Editor'));

export default function MobileApp(): JSXElement {
  const [portalHostRef, setPortalHostRef] = createSignal<HTMLElement>();

  return (
    <Suspense
      fallback={<LoadingOverlay height={44} overlay={true} width={44} />}
    >
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
        <LazyEditor />
      </Canvas>

      <BottomBar portalHostRef={portalHostRef()} />
    </Suspense>
  );
}
