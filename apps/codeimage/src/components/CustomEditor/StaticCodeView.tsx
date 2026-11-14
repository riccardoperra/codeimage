import type {CustomTheme} from '@codeimage/highlight';
import type {Language} from '@codemirror/language';
import {tokenizeCode} from '@core/snapshot/tokenize';
import {createEffect, createMemo, For, Show} from 'solid-js';
import {isServer} from 'solid-js/web';
import {getStaticTheme, mountStaticTheme} from './staticTheme';

export interface StaticCodeViewProps {
  code: string;
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
  const theme = createMemo(() => getStaticTheme(props.theme));
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
                <For each={lines()}>
                  {(_, index) => (
                    <div
                      class="cm-gutterElement"
                      style={{'grid-row': `${index() + 1}`}}
                    >
                      {props.lineNumberStart + index()}
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
          <div class="cm-content cm-lineWrapping">
            <For each={lines()}>
              {line => (
                <div class="cm-line">
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
