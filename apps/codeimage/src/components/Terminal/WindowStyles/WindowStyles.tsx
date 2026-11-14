import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {getRootEditorStore} from '@codeimage/store/editor';
import {createMemo, For, Show, type ParentComponent} from 'solid-js';
import {TerminalWindowTabList} from '../Tabs/TerminalWindowTabList';
import type {BaseTerminalProps} from '../TerminalHost';
import {TerminalHost} from '../TerminalHost';
import * as baseStyles from '../terminal.css';
import * as styles from './WindowStyles.css';

export type WindowStyle = 'card' | 'editor' | 'shell';

// The window's own text is part of the exported image, so it is the same in
// every interface language and needs no translation context, which the Node
// renderer does not provide.

const WindowStyleTerminal: ParentComponent<
  BaseTerminalProps & {windowStyle: WindowStyle}
> = props => {
  const editor = getRootEditorStore();
  const active = createMemo(() =>
    editor.state.editors.find(tab =>
      props.activeTabId
        ? tab.id === props.activeTabId
        : editor.isActive(tab.id),
    ),
  );
  const name = () => active()?.tab.tabName?.trim() ?? '';
  const lineCount = () => (active()?.code ?? '').split('\n').length;
  const language = () =>
    SUPPORTED_LANGUAGES.find(language => language.id === active()?.languageId)
      ?.label ??
    active()?.languageId ??
    '';
  const tabList = () => (
    <TerminalWindowTabList
      appearance={props.windowStyle}
      activeTabId={props.activeTabId}
      lite={props.lite}
      showOnlyActiveTab={props.showOnlyActiveTab}
      preview={props.preview ?? false}
      readOnly={props.readonlyTab}
      accent={false}
    />
  );
  return (
    <TerminalHost
      {...props}
      themeClass={styles.theme}
      style={{'--codeimage-window-font': editor.computed.selectedFont().name}}
      windowStyle={props.windowStyle}
    >
      <div class={styles.body}>
        <Show when={props.showHeader}>
          <div class={styles.bar} data-style={props.windowStyle}>
            <Show when={props.windowStyle === 'shell'}>
              <div class={styles.dots}>
                <div class={styles.dot} />
                <div class={styles.dot} />
                <div class={styles.dot} />
              </div>
            </Show>
            <Show when={props.showTab && (!props.lite || props.preview)}>
              {tabList()}
            </Show>
            <Show when={props.windowStyle === 'card'}>
              <span class={styles.language}>{language()}</span>
            </Show>
          </div>
          <Show when={props.windowStyle === 'editor' && name().includes('/')}>
            <div class={styles.breadcrumb}>
              <For each={name().split('/')}>
                {(part, index) => (
                  <>
                    <Show when={index() > 0}>
                      <span aria-hidden="true">›</span>
                    </Show>
                    <span
                      class={
                        index() === name().split('/').length - 1
                          ? styles.leaf
                          : undefined
                      }
                    >
                      {part}
                    </span>
                  </>
                )}
              </For>
            </div>
          </Show>
          <Show when={props.windowStyle === 'shell' && name()}>
            <div class={styles.prompt}>
              <span class={styles.promptSign} aria-hidden="true" />
              <span>cat {name()}</span>
            </div>
          </Show>
        </Show>
        <Show when={props.children}>
          <div class={baseStyles.content}>
            <div class={styles.codeBody}>{props.children}</div>
          </div>
        </Show>
        <Show when={props.showHeader && props.windowStyle === 'editor'}>
          <div class={styles.status}>
            <span class={styles.statusLanguage}>
              <span class={styles.mark} />
              {language()}
            </span>
            <span>
              {`${lineCount()} ${lineCount() === 1 ? 'line' : 'lines'}`}
            </span>
          </div>
        </Show>
      </div>
    </TerminalHost>
  );
};

export const CardTerminal: ParentComponent<BaseTerminalProps> = props => (
  <WindowStyleTerminal {...props} windowStyle="card" />
);
export const EditorTerminal: ParentComponent<BaseTerminalProps> = props => (
  <WindowStyleTerminal {...props} windowStyle="editor" />
);
export const ShellTerminal: ParentComponent<BaseTerminalProps> = props => (
  <WindowStyleTerminal {...props} windowStyle="shell" />
);
