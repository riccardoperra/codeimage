import type {CustomTheme} from '@codeimage/highlight';
import {createEffect, createMemo} from 'solid-js';
import {isServer} from '@solidjs/web';
import {
  createStaticWatermarkRef,
  useWatermarkScope,
} from '@core/watermark/scope';
import {getStaticTheme, mountStaticTheme} from './staticTheme';
import './plugins/lineMarks/marks.css';

export interface AnimatedCodeViewProps {
  // The markup `compileScene` returns. Its stylesheet goes to the renderer.
  html: string;
  languageId: string;
  theme: CustomTheme;
  showLineNumbers: boolean;
  fontFamily: string;
  fontWeight: number;
  enableLigatures: boolean;
  timeMs?: number;
}

// StaticCodeView with the code area replaced by the compiled spans. Focus
// lives in each span's keyframes, so the root leaves out data-line-focus.
export default function AnimatedCodeView(props: AnimatedCodeViewProps) {
  const theme = createMemo(() => getStaticTheme(props.theme));
  const watermark = useWatermarkScope();
  const codeRef = createStaticWatermarkRef(watermark);
  createEffect(
    () => props.timeMs,
    () => watermark?.invalidate(),
  );
  if (!isServer)
    createEffect(
      () => props.theme,
      theme => mountStaticTheme(document, theme),
    );
  return (
    <code class={`language-${props.languageId}`}>
      <div
        class={`cm-editor ${theme().classes}`}
        data-animated-code-view
        data-line-marks="true"
        data-line-numbers={String(props.showLineNumbers)}
        style={{
          '--codeimage-font-family': `${props.fontFamily}, monospace`,
          '--codeimage-font-weight': props.fontWeight,
          '--codeimage-font-ligatures': props.enableLigatures
            ? 'normal'
            : 'none',
        }}
      >
        <div
          class="cm-scroller"
          ref={codeRef}
          style={{'grid-template-rows': 'repeat(1, auto)'}}
          // compileScene escapes every token text and class.
          // oxlint-disable-next-line solid/no-innerhtml
          innerHTML={props.html}
        />
      </div>
    </code>
  );
}
