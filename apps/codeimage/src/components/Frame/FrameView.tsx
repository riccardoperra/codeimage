import {FittedWindow} from './FittedWindow';
import {FrameSignature, framePadding, signatureScale} from './FrameSignature';
import {getAssetsStore, isAssetUrl} from '@codeimage/store/assets/assets';
import {AssetsImage} from '@codeimage/store/assets/AssetsImage';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {getFrameState} from '@codeimage/store/editor/frame';
import type {EditorState} from '@codeimage/store/editor/model';
import type {Language} from '@codemirror/language';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import type {Ref, VoidProps} from 'solid-js';
import {createMemo, Show} from 'solid-js';
import {DynamicTerminal} from '../Terminal/DynamicTerminal/DynamicTerminal';
import StaticCodeView from '../CustomEditor/StaticCodeView';
import * as styles from './Frame.css';

export interface FrameViewProps {
  ref?: Ref<HTMLDivElement>;
  tab?: EditorState;
  language: Language | null;
  showOnlyActiveTab?: boolean;
}

export function FrameView(props: VoidProps<FrameViewProps>) {
  const frame = getFrameState().store;
  const target = () => getFrameState().exportTarget();
  const scale = () => signatureScale(target()?.resolution[0] ?? frame.width);
  const terminal = getTerminalState().state;
  const editor = getRootEditorStore();
  const tab = () => props.tab ?? getActiveEditorStore().editor();
  const assetsStore = getAssetsStore();
  const theme = createMemo(() => {
    const themes = getThemeStore().themeArray();
    return (
      themes.find(theme => theme()?.id === editor.state.options.themeId)?.() ??
      themes[0]()
    );
  });

  return (
    <div class={styles.previewWrapper} ref={props.ref}>
      <div
        class={styles.container}
        data-snapshot-frame
        style={assignInlineVars({
          overflow: 'hidden',
          [styles.frameVars.radius]: `${frame.radius}px`,
          [styles.frameVars.width]: target()
            ? `${target()!.resolution[0]}px`
            : frame.width
              ? `${frame.width}px`
              : 'max-content',
          [styles.frameVars.height]: target()
            ? `${target()!.resolution[1]}px`
            : frame.height
              ? `${frame.height}px`
              : 'auto',
          [styles.frameVars.minWidth]: target() ? '0' : 'max-content',
          [styles.frameVars.minHeight]: target() ? '0' : '100%',
          [styles.frameVars.padding]: framePadding(
            frame.padding,
            frame.signature,
            scale(),
          ),
        })}
      >
        <div
          class={styles.previewOverlay}
          style={assignInlineVars({
            [styles.frameVars.backgroundColor]: assetsStore.isAssetUrl(
              frame.background,
            )
              ? 'transparent'
              : (frame.background ?? 'transparent'),
            [styles.frameVars.opacity]: `${frame.opacity}%`,
            [styles.frameVars.visibility]: `${
              frame.visible ? 'visible' : 'hidden'
            }`,
          })}
        >
          <Show when={isAssetUrl(frame.background) && frame.background}>
            {assetId => (
              <AssetsImage
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  'object-fit': 'cover',
                }}
                assetId={assetId()}
              />
            )}
          </Show>
        </div>

        <div data-snapshot-window style={{display: 'contents'}}>
          <FittedWindow active={!!target()}>
            <DynamicTerminal
              type={terminal.type}
              activeTabId={props.tab?.id}
              readonlyTab={true}
              showTab={true}
              showOnlyActiveTab={props.showOnlyActiveTab}
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
              <Show when={tab()}>
                {active => (
                  <StaticCodeView
                    code={active().code}
                    marks={active().marks}
                    languageId={active().languageId}
                    language={props.language}
                    theme={theme()!}
                    showLineNumbers={editor.state.options.showLineNumbers}
                    lineNumberStart={active().lineNumberStart ?? 1}
                    fontFamily={editor.computed.selectedFont().name}
                    fontWeight={editor.state.options.fontWeight}
                    enableLigatures={editor.state.options.enableLigatures}
                  />
                )}
              </Show>
            </DynamicTerminal>
          </FittedWindow>
        </div>
        <FrameSignature
          signature={frame.signature}
          background={frame.background}
          scale={scale()}
        />
      </div>
    </div>
  );
}
