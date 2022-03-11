import EditorForm from './EditorForm';
// import WindowStyleForm from './WindowStyleForm';
// import FrameStyleForm from './FrameStyleForm';
// import EditorStyleForm from './EditorStyleForm';
import {JSXElement, lazy, Suspense} from 'solid-js';

const FrameStyleForm = lazy(() => import('./FrameStyleForm'));
const EditorStyleForm = lazy(() => import('./EditorStyleForm'));
const WindowStyleForm = lazy(() => import('./WindowStyleForm'));

export default function EditorSidebar(): JSXElement {
  return (
    <EditorForm>
      <Suspense
        fallback={
          <>
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
          </>
        }
      >
        <FrameStyleForm />

        <WindowStyleForm />

        <EditorStyleForm />
      </Suspense>
    </EditorForm>
  );
}
