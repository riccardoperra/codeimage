import {exportExclude as _exportExclude} from '@core/directives/exportExclude';
import type {ParentProps} from 'solid-js';
import {createSignal, onCleanup, onMount} from 'solid-js';
import * as styles from '../../components/Frame/FrameHandler.css';

const exportExclude = _exportExclude;
void exportExclude;

const GUTTER = 24;

interface FitFrameProps {
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
  const [scale, setScale] = createSignal(1);

  onMount(() => {
    const available = {width: 0, height: 0};
    const natural = {width: 0, height: 0};

    const fit = () => {
      if (!natural.width || !natural.height) return;
      const next = Math.min(
        1,
        (available.width - GUTTER * 2) / natural.width,
        (available.height - GUTTER * 2) / natural.height,
      );
      const rounded = Math.max(0.1, Math.round(next * 1000) / 1000);
      if (rounded === scale()) return;
      setScale(rounded);
      props.onScaleChange(rounded);
    };

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const target = entry.target === wrapper ? available : natural;
        target.width = entry.contentRect.width;
        target.height = entry.contentRect.height;
      }
      fit();
    });
    observer.observe(wrapper);
    observer.observe(content);
    onCleanup(() => observer.disconnect());
  });

  return (
    <div class={styles.wrapper} ref={wrapper} style={{overflow: 'hidden'}}>
      <div
        class={styles.handler}
        style={{zoom: scale(), 'margin-bottom': 0}}
        data-fit-scale={scale()}
      >
        <div class={styles.content} ref={content}>
          <div
            use:exportExclude={true}
            class={styles.squaredBackgroundOverlay}
          />
          {props.children}
        </div>
      </div>
    </div>
  );
}
