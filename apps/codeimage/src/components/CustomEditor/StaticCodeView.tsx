import type {CustomTheme} from '@codeimage/highlight';
import type {TabMarks} from '@codeimage/store/editor/model';
import type {Language} from '@codemirror/language';
import {tokenizeCode} from '@core/snapshot/tokenize';
import {createEffect, createMemo, For, on, Show} from 'solid-js';
import {isServer} from 'solid-js/web';
import {useWatermarkScope} from '../../core/watermark/scope';
import {getStaticTheme, mountStaticTheme} from './staticTheme';
import './plugins/lineMarks/marks.css';

export interface StaticCodeViewProps {
  code: string;
  // Animation capture mounts long code in small batches.
  lineLimit?: number;
  marks: TabMarks;
  languageId: string;
  language: Language | null;
  theme: CustomTheme;
  showLineNumbers: boolean;
  lineNumberStart: number;
  fontFamily: string;
  fontWeight: number;
  enableLigatures: boolean;
}

export default function StaticCodeView(props: StaticCodeViewProps) {
  const lines = createMemo(() =>
    tokenizeCode(props.code, props.language, props.theme),
  );
  const visibleLines = () =>
    lines().slice(0, props.lineLimit ?? lines().length);
  const theme = createMemo(() => getStaticTheme(props.theme));
  const watermark = useWatermarkScope();
  const marks = createMemo(
    () =>
      new Map(
        props.marks.lines
          .filter(mark => mark.line >= 1 && mark.line <= lines().length)
          .map(mark => [mark.line, mark.kind]),
      ),
  );
  const focused = createMemo(
    () =>
      new Set(
        props.marks.focusedLines.filter(
          line => line >= 1 && line <= lines().length,
        ),
      ),
  );
  createEffect(
    on(
      () => [
        lines(),
        theme(),
        marks(),
        focused(),
        props.fontFamily,
        props.fontWeight,
        props.enableLigatures,
        props.showLineNumbers,
        props.lineNumberStart,
      ],
      () => watermark?.invalidate(),
    ),
  );
  const hasDiff = () =>
    Array.from(marks().values()).some(kind => kind !== 'highlight');
  if (!isServer) createEffect(() => mountStaticTheme(document, props.theme));
  const ligatures = () => (props.enableLigatures ? 'normal' : 'none');
  // CodeMirror sizes the gutter for the largest line number with as many digits as the line count.
  const gutterSpacer = () => {
    const largest = 10 ** String(lines().length).length - 1;
    return largest + props.lineNumberStart - 1;
  };
  return (
    <code class={`language-${props.languageId}`}>
      <div
        class={`cm-editor ${theme().classes}`}
        data-static-code-view
        data-line-marks="true"
        data-line-focus={String(focused().size > 0)}
        data-line-diff={String(hasDiff())}
        data-line-numbers={String(props.showLineNumbers)}
        style={{
          '--codeimage-font-family': `${props.fontFamily}, monospace`,
          '--codeimage-font-weight': props.fontWeight,
          '--codeimage-font-ligatures': ligatures(),
        }}
      >
        <div
          class="cm-scroller"
          style={{'grid-template-rows': `repeat(${lines().length}, auto)`}}
        >
          <Show when={props.showLineNumbers}>
            <div class="cm-gutters" aria-hidden="true">
              <div class="cm-gutter cm-lineNumbers">
                <div
                  class="cm-gutterElement"
                  style={{'grid-row': '1', visibility: 'hidden'}}
                >
                  {gutterSpacer()}
                </div>
                <For each={visibleLines()}>
                  {(_, index) => (
                    <div
                      class="cm-gutterElement"
                      classList={{
                        'cm-lineMarkDim':
                          focused().size > 0 && !focused().has(index() + 1),
                        'cm-lineMark-added':
                          marks().get(index() + 1) === 'added',
                        'cm-lineMark-removed':
                          marks().get(index() + 1) === 'removed',
                        'cm-lineMark-highlight':
                          marks().get(index() + 1) === 'highlight',
                      }}
                      style={{'grid-row': `${index() + 1}`}}
                    >
                      {props.lineNumberStart + index()}
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
          <div
            class="cm-content cm-lineWrapping"
            style={{'white-space': 'pre'}}
            ref={root => watermark?.attach('code', {kind: 'static', root})}
          >
            <For each={visibleLines()}>
              {(line, index) => (
                <div
                  class="cm-line"
                  data-mark={marks().get(index() + 1)}
                  data-focused={focused().has(index() + 1) ? 'true' : undefined}
                >
                  <For each={line}>
                    {span => (
                      <Show when={span.classes} fallback={span.text}>
                        <span class={span.classes}>{span.text}</span>
                      </Show>
                    )}
                  </For>
                  <Show when={!line.length}>
                    <br />
                  </Show>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </code>
  );
}
