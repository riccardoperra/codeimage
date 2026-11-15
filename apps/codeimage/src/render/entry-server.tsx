import '../assets/styles/app.scss';
import '../theme/global.css';
import {getExportTarget} from '@codeimage/config';
import type {CommentTokens} from '@codemirror/commands';
import {EditorState} from '@codemirror/state';
import type {
  RenderSnapshot,
  ComposedFrame,
  FrameHost,
  FrameMarkup,
  FrameSize,
} from './contract';
import {parseAnnotations} from '../core/diff/parseAnnotations';
import {
  FITTED_WINDOW_MIN_WIDTH,
  fittedPlacement,
} from '../components/Frame/FittedWindow';
import type {FittedPlacement} from '../components/Frame/FittedWindow';
import {
  FrameView,
  frameSignatureScale,
  targetViewport,
} from '../components/Frame/FrameView';
import {
  frameMediaRequest,
  resolveFrameMedia,
} from '../components/Frame/frameMedia';
import {TONE_SAMPLE_SIZE} from '../components/Frame/signatureTone';
import {getEditorStore} from '@codeimage/store/editor';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {THEME_REGISTRY} from '@codeimage/store/theme/themeRegistry';
import {SUPPORTED_FONTS} from '@core/configuration/font';
import {loadLanguage} from '@core/snapshot/tokenize';
import {renderToStringAsync} from 'solid-js/web';
import {StateProvider} from 'statebuilder';
import {staticThemeCss} from '../components/CustomEditor/staticTheme';
import * as styles from '../components/Frame/Frame.css';

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

// Solid's client typings omit this server-only option.
const SSR_OPTIONS = {timeoutMs: 30_000, noScripts: true};
const EXPORT_EXCLUDE_CSS =
  '[data-export-exclude="true"]{display:none!important}';

// Only store initialization and JSX serialization share singleton app state.
let queue: Promise<unknown> = Promise.resolve();
function serialize(pass: () => Promise<FrameMarkup>): Promise<FrameMarkup> {
  const result = queue.then(pass);
  queue = result.catch(() => undefined);
  return result;
}

const cssVar = (variable: string) =>
  variable.replace(/^var\((--[^,)]+).*$/, '$1');

// The web frame's min-width is max-content, so it grows past its width, and
// past its max-width, rather than wrap a line. Takumi ignores that min-width.
// Without a size this lets the frame take its content width for measuring;
// with one it pins the frame to the size the renderer derived from it.
function frameSizeCss(size?: FrameSize): string {
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
    .map(([variable, value]) => `${cssVar(variable)}:${value}!important`)
    .join(';')}}`;
}

export async function composeFrame(
  snapshot: RenderSnapshot,
  host: FrameHost,
): Promise<ComposedFrame> {
  const {frame, terminal, editor} = snapshot;
  const {themeId, fontId} = editor.options;
  const active = editor.editors[0];
  const themeDefinition = THEME_REGISTRY.find(theme => theme.id === themeId);
  if (!themeDefinition) throw new Error(`Unknown theme "${themeId}"`);
  const font = SUPPORTED_FONTS.find(font => font.id === fontId);
  if (!font) throw new Error(`Unknown font "${fontId}"`);
  const [theme, language] = await Promise.all([
    themeDefinition.load(),
    loadLanguage(active.languageId, active.tabName),
  ]);
  const normalized = {
    ...frame,
    exportTarget: frame.exportTarget ?? null,
    aspectRatio: frame.aspectRatio ?? null,
    background: frame.background ?? theme.properties.previewBackground,
  };
  const {media, images} = await resolveFrameMedia(
    frameMediaRequest(normalized),
    image =>
      host.pixels(
        {
          html: '<img src="sample" style="display:block;width:24px;height:24px"/>',
          css: [],
          images: [{...image, src: 'sample'}],
          fontFamily: font.name,
        },
        TONE_SAMPLE_SIZE,
      ),
  );
  const target = getExportTarget(frame.exportTarget);
  const renderPass = (
    appearance: typeof normalized,
    placement?: FittedPlacement,
  ) =>
    serialize(async () => {
      const SnapshotFrame = () => {
        const store = getEditorStore();
        store.editor.actions.setFromPersistedState(editor);
        store.frame.setFromPersistedState(appearance);
        store.frame.setWidth(snapshot.width ?? 0);
        store.frame.setHeight(0);
        store.terminal.setFromPersistedState({
          ...terminal,
          background: terminal.background || theme.properties.terminal.main,
          textColor: terminal.textColor || theme.properties.terminal.text,
        });
        getThemeStore().getThemeResource(theme.id)[1].mutate(theme);
        return (
          <FrameView
            tab={store.editor.state.editors[0]}
            language={language}
            media={media}
            windowPlacement={placement}
            showOnlyActiveTab={false}
          />
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
        css: [staticThemeCss(theme), EXPORT_EXCLUDE_CSS],
        fontFamily: font.name,
        images,
      };
    });
  if (target) {
    const bare = await renderPass({
      ...normalized,
      exportTarget: null,
      signature: null,
    });
    const natural = await host.measure({
      ...bare,
      css: [...bare.css, frameSizeCss()],
    });
    const content = {
      width: Math.max(
        FITTED_WINDOW_MIN_WIDTH,
        Math.round(natural.width - frame.padding * 2),
      ),
      height: Math.max(1, Math.round(natural.height - frame.padding * 2)),
    };
    const viewport = targetViewport(
      target.resolution,
      frame.padding,
      frame.signature,
      frameSignatureScale({width: snapshot.width ?? 0}, target),
    );
    const markup = await renderPass(
      normalized,
      fittedPlacement(viewport, content),
    );
    return {
      ...markup,
      browserCss: markup.css,
      size: {width: target.resolution[0], height: target.resolution[1]},
    };
  }
  const markup = await renderPass(normalized);
  const natural = await host.measure({
    ...markup,
    css: [...markup.css, frameSizeCss()],
  });
  const size = {
    width: Math.max(snapshot.width ?? 0, natural.width),
    height: natural.height,
  };
  return {
    ...markup,
    css: [...markup.css, frameSizeCss(size)],
    browserCss: markup.css,
    size: {width: Math.round(size.width), height: Math.round(size.height)},
  };
}
