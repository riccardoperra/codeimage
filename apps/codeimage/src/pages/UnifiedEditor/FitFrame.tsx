import {getRootEditorStore} from '@codeimage/store/editor';
import {repositionTooltips} from '@codemirror/view';
import type {JSX} from '@solidjs/web';
import type {ParentProps} from 'solid-js';
import {createSignal, onSettled} from 'solid-js';
import * as styles from '../../components/Frame/FrameHandler.css';
import {canvas} from './snippet.css';

const GUTTER = 24;

interface FitFrameProps {
  overlay?: JSX.Element;
  onScaleChange: (scale: number) => void;
}

/**
 * Production `FrameHandler` scales the frame once, and only on mobile. This one
 * keeps the frame inside its parent at every size. It uses `zoom`, not
 * `transform`, because a transformed ancestor misplaces CodeMirror's tooltips
 * (https://github.com/riccardoperra/codeimage/issues/42).
 */
export function FitFrame(props: ParentProps<FitFrameProps>) {
  let wrapper!: HTMLDivElement;
  let content!: HTMLDivElement;
  const editor = getRootEditorStore();
  const [scale, setScale] = createSignal(1);
  const [ready, setReady] = createSignal(false);

  onSettled(() => {
    const available = {width: 0, height: 0};
    const natural = {width: 0, height: 0};

    /** Applies the scale that fits, and says whether it changed. */
    const fit = () => {
      if (!natural.width || !natural.height) return false;
      const next = Math.min(
        1,
        (available.width - GUTTER * 2) / natural.width,
        (available.height - GUTTER * 2) / natural.height,
      );
      const rounded = Math.max(0.1, Math.round(next * 1000) / 1000);
      if (rounded === scale()) return false;
      setScale(rounded);
      props.onScaleChange(rounded);
      return true;
    };

    // The fit runs in the observer's callback, after layout and before the
    // paint, so new content, the placeholder or the frame, never shows once
    // at its full size. A new zoom moves the content's size by a fraction of
    // a pixel, so after one the content is observed again only from the next
    // frame, which keeps the observer from reporting a resize loop.
    let frame = 0;
    const observer = new ResizeObserver(entries => {
      let resized = false;
      for (const entry of entries) {
        const {width, height} = entry.contentRect;
        const target = entry.target === wrapper ? available : natural;
        // Under a zoom the content snaps to the screen's pixels, so each zoom
        // moves its size by up to a pixel of the screen: at 390px, 591.7 and
        // 592.5 in turn. Taking that move as new content flipped the zoom
        // between 0.222 and 0.223 on every frame.
        const snap =
          target === natural ? 2 / (scale() * window.devicePixelRatio) : 0;
        if (
          Math.abs(target.width - width) <= snap &&
          Math.abs(target.height - height) <= snap
        )
          continue;
        target.width = width;
        target.height = height;
        resized = true;
      }
      if (!resized) return;
      const changed = fit();
      const view = editor.activeEditorView();
      if (view) repositionTooltips(view);
      if (
        available.width &&
        available.height &&
        natural.width &&
        natural.height
      )
        setReady(true);
      if (!changed) return;
      observer.unobserve(content);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => observer.observe(content));
    });
    observer.observe(wrapper);
    observer.observe(content);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  });

  return (
    <div
      class={`${styles.wrapper} ${canvas}`}
      ref={wrapper}
      style={{overflow: 'hidden'}}
    >
      {props.overlay}
      <div
        class={styles.handler}
        style={{
          zoom: scale(),
          opacity: ready() ? undefined : 0,
          'margin-bottom': 0,
        }}
        data-fit-scale={scale()}
      >
        <div class={styles.content} ref={content}>
          <div
            data-export-exclude="true"
            class={styles.squaredBackgroundOverlay}
          />
          {props.children}
        </div>
      </div>
    </div>
  );
}
