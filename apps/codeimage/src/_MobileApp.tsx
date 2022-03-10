import {createSignal, JSXElement, lazy, Suspense} from 'solid-js';

const LazyBottomBar = lazy(() => import('./components/BottomBar/BottomBar'));

const LazyEditor = lazy(() => import('./components/Editor/Editor'));

export default function MobileApp(): JSXElement {
  const [portalHostRef, setPortalHostRef] = createSignal<HTMLElement>();

  return (
    <>
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

      <Suspense fallback={<></>}>
        <LazyEditor />
      </Suspense>

      <LazyBottomBar portalHostRef={portalHostRef()} />
    </>
  );
}
