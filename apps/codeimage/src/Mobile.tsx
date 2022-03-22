import {createSignal, JSXElement, lazy, Suspense} from 'solid-js';
import {Footer} from './components/Footer/Footer';
import {Canvas} from './components/Scaffold/Canvas/Canvas';
import {Toolbar} from './components/Toolbar/Toolbar';

const BottomBar = lazy(() => {
  return import('./components/BottomBar/BottomBar').then(e => {
    return {default: e.BottomBar};
  });
});

const EditorHandler = lazy(
  () => import('./components/CustomEditor/EditorHandler'),
);

export default function MobileView(): JSXElement {
  const [frameRef, setFrameRef] = createSignal<HTMLElement>();

  return (
    <>
      <Canvas>
        <Toolbar canvasRef={frameRef()} />

        <Suspense>
          <EditorHandler frameRef={setFrameRef} />
        </Suspense>

        <Footer />
      </Canvas>

      <Suspense>
        <BottomBar />
      </Suspense>
    </>
  );
}
