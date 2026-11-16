import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';

import {getTerminalState} from '@codeimage/store/editor/terminal';

import type {VoidProps} from 'solid-js';
import {Show} from 'solid-js';
import {DynamicTerminal} from '../Terminal/DynamicTerminal/DynamicTerminal';
import StaticCodeView from '../CustomEditor/StaticCodeView';

import type {FrameViewProps} from './FrameView';
export function createFrameTerminal(props: VoidProps<FrameViewProps>) {
  const terminal = getTerminalState().state;
  const editor = getRootEditorStore();
  const tab = () => props.tab ?? getActiveEditorStore().editor();
  const staticCode = () => {
    const theme = props.theme;
    if (!theme) return undefined;
    const active = tab();
    return active ? {theme, tab: active} : undefined;
  };
  return () => (
    <DynamicTerminal
      type={terminal.type}
      activeTabId={props.activeTabId ?? props.tab?.id}
      readonlyTab={true}
      fixedTabs={!!props.header}
      headerMode={props.header?.mode}
      title={props.header?.mode === 'title' ? props.header.title : undefined}
      showTab={props.header?.mode !== 'title'}
      showOnlyActiveTab={
        props.header ? props.header.mode === 'tab' : props.showOnlyActiveTab
      }
      shadow={terminal.shadow}
      background={terminal.background}
      accentVisible={terminal.accentVisible}
      textColor={terminal.textColor}
      showHeader={terminal.showHeader}
      showGlassReflection={terminal.showGlassReflection}
      showWatermark={terminal.showWatermark}
      opacity={terminal.opacity}
      alternativeTheme={terminal.alternativeTheme}
      borderType={terminal.borderType}
      surface={terminal.surface}
      themeId={editor.state.options.themeId}
    >
      {props.code ?? (
        <Show when={staticCode()}>
          {active => (
            <StaticCodeView
              code={active().tab.code}
              marks={active().tab.marks}
              languageId={active().tab.languageId}
              language={props.language ?? null}
              theme={active().theme}
              showLineNumbers={editor.state.options.showLineNumbers}
              lineNumberStart={active().tab.lineNumberStart ?? 1}
              fontFamily={editor.computed.selectedFont().name}
              fontWeight={editor.state.options.fontWeight}
              enableLigatures={editor.state.options.enableLigatures}
            />
          )}
        </Show>
      )}
    </DynamicTerminal>
  );
}
