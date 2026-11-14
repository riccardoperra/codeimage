import '../assets/styles/app.scss';
import {getExportTarget} from '@codeimage/config';
import type {CommentTokens} from '@codemirror/commands';
import {EditorState} from '@codemirror/state';
import {parseAnnotations} from '../core/diff/parseAnnotations';
import {FrameSignature, framePadding} from '../components/Frame/FrameSignature';

import '../theme/global.css';
import {isAssetLinkUrl, isAssetUrl} from '@codeimage/store/assets/assets';
import {getEditorStore} from '@codeimage/store/editor';
import type {ProjectEditorPersistedState} from '@codeimage/store/editor/model';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {THEME_REGISTRY} from '@codeimage/store/theme/themeRegistry';
import {SUPPORTED_FONTS} from '@core/configuration/font';
import {loadLanguage} from '@core/snapshot/tokenize';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {renderToStringAsync} from 'solid-js/web';
import {StateProvider} from 'statebuilder';
import StaticCodeView from '../components/CustomEditor/StaticCodeView';
import {staticThemeCss} from '../components/CustomEditor/staticTheme';
import * as styles from '../components/Frame/Frame.css';
import {DynamicTerminal} from '../components/Terminal/DynamicTerminal/DynamicTerminal';

export const targetSize = (id: string | null | undefined) =>
  getExportTarget(id)?.resolution;

export async function annotateCode(
  code: string,
  languageId: string,
  tabName: string,
) {
  const language = await loadLanguage(languageId, tabName);
  const state = EditorState.create({
    doc: code,
    extensions: language ? [language] : [],
  });
  return parseAnnotations(
    code,
    state.languageDataAt<CommentTokens>('commentTokens', 0)[0] ?? {},
  );
}

export const SUPPORTED_FONT_IDS = SUPPORTED_FONTS.map(font => font.id);
export const SUPPORTED_THEME_IDS = THEME_REGISTRY.map(theme => theme.id);

export interface FrameSize {
  width: number;
  height: number;
}

export interface FrameMarkup {
  html: string;
  css: string;
  fontFamily: string;
  backgroundImage: string | null;
}

type RenderSnapshot = ProjectEditorPersistedState & {width?: number};

// Solid's client typings, which the app type-checks against, omit this
// server-only option.
const SSR_OPTIONS = {timeoutMs: 30_000, noScripts: true};

const EXPORT_EXCLUDE_CSS =
  '[data-export-exclude="true"]{display:none!important}';

// The editor, frame and theme stores are app-wide singletons, so renders run
// one at a time and each one sees only its own snapshot.
let queue: Promise<unknown> = Promise.resolve();

export function renderFrame(snapshot: RenderSnapshot): Promise<FrameMarkup> {
  const result = queue.then(() => render(snapshot));
  queue = result.catch(() => undefined);
  return result;
}

const cssVar = (variable: string) =>
  variable.replace(/^var\((--[^,)]+).*$/, '$1');

// The web frame's min-width is max-content, so it grows past its width, and
// past its max-width, rather than wrap a line. Takumi ignores that min-width.
// Without a size this lets the frame take its content width for measuring;
// with one it pins the frame to the size the renderer derived from it.
export function frameSizeCss(size?: FrameSize): string {
  const declarations = size
    ? [
        [styles.frameVars.width, `${size.width}px`],
        [styles.frameVars.minWidth, `${size.width}px`],
        [styles.frameVars.height, `${size.height}px`],
      ]
    : [
        [styles.frameVars.width, 'max-content'],
        [styles.frameVars.maxWidth, 'none'],
      ];
  return `[data-snapshot-frame]{${declarations
    .map(([variable, value]) => `${cssVar(variable)}:${value}`)
    .join(';')}}`;
}

async function render(snapshot: RenderSnapshot): Promise<FrameMarkup> {
  const {frame, terminal, editor} = snapshot;
  const {themeId, fontId} = editor.options;
  const activeEditor = editor.editors[0];
  const themeDefinition = THEME_REGISTRY.find(theme => theme.id === themeId);
  if (!themeDefinition) throw new Error(`Unknown theme "${themeId}"`);
  const font = SUPPORTED_FONTS.find(font => font.id === fontId);
  if (!font) throw new Error(`Unknown font "${fontId}"`);
  if (isAssetUrl(frame.background) && !isAssetLinkUrl(frame.background)) {
    throw new Error(
      `Frame background "${frame.background}" is a browser asset; the snapshot does not carry its image`,
    );
  }
  const [theme, language] = await Promise.all([
    themeDefinition.load(),
    loadLanguage(activeEditor.languageId, activeEditor.tabName),
  ]);
  const background = frame.background ?? theme.properties.previewBackground;
  const backgroundImage = isAssetLinkUrl(background)
    ? background.slice('link:'.length)
    : null;

  const SnapshotFrame = () => {
    const store = getEditorStore();
    store.editor.actions.setFromPersistedState(editor);
    store.frame.setFromPersistedState(frame);
    store.terminal.setFromPersistedState(terminal);
    getThemeStore().getThemeResource(theme.id)[1].mutate(theme);

    return (
      <div class={styles.previewWrapper}>
        <div
          class={styles.container}
          data-snapshot-frame
          style={assignInlineVars({
            overflow: 'hidden',
            [styles.frameVars.radius]: `${frame.radius}px`,
            [styles.frameVars.padding]: framePadding(
              frame.padding,
              frame.signature,
            ),
          })}
        >
          <div
            class={styles.previewOverlay}
            style={assignInlineVars({
              [styles.frameVars.backgroundColor]: isAssetUrl(background)
                ? 'transparent'
                : background,
              [styles.frameVars.opacity]: `${frame.opacity}%`,
              [styles.frameVars.visibility]: frame.visible
                ? 'visible'
                : 'hidden',
            })}
          >
            {backgroundImage && (
              <img
                src={backgroundImage}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                  'object-fit': 'cover',
                }}
              />
            )}
          </div>
          <div data-snapshot-window style={{display: 'contents'}}>
            <DynamicTerminal
              type={terminal.type}
              readonlyTab={true}
              showTab={true}
              showOnlyActiveTab={false}
              shadow={terminal.shadow}
              background={terminal.background || theme.properties.terminal.main}
              accentVisible={terminal.accentVisible}
              textColor={terminal.textColor || theme.properties.terminal.text}
              showHeader={terminal.showHeader}
              showGlassReflection={terminal.showGlassReflection}
              showWatermark={terminal.showWatermark}
              opacity={terminal.opacity}
              alternativeTheme={terminal.alternativeTheme}
              borderType={terminal.borderType}
              themeId={theme.id}
            >
              <StaticCodeView
                code={activeEditor.code}
                marks={activeEditor.marks ?? {lines: [], focus: false}}
                languageId={activeEditor.languageId}
                language={language}
                theme={theme}
                showLineNumbers={editor.options.showLineNumbers}
                lineNumberStart={activeEditor.lineNumberStart}
                fontFamily={font.name}
                fontWeight={editor.options.fontWeight}
                enableLigatures={editor.options.enableLigatures}
              />
            </DynamicTerminal>
          </div>
          <FrameSignature signature={frame.signature ?? null} />
        </div>
      </div>
    );
  };

  const body = await renderToStringAsync(
    () => (
      <StateProvider>
        <SnapshotFrame />
      </StateProvider>
    ),
    SSR_OPTIONS,
  );
  return {
    html: `<html><body>${body}</body></html>`,
    css: [
      staticThemeCss(theme),
      EXPORT_EXCLUDE_CSS,
      `[data-snapshot-frame]{${cssVar(styles.frameVars.width)}:${
        snapshot.width === undefined ? 'max-content' : `${snapshot.width}px`
      }}`,
    ].join('\n'),
    fontFamily: font.name,
    backgroundImage,
  };
}
