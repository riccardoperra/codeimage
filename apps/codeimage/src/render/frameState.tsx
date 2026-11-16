import type {ProjectEditorPersistedState} from '@codeimage/store/editor/model';
import type {PersistedFrameState} from '@codeimage/store/frame/model';

import {canHostWatermarkFrame} from '@codeimage/render/watermark';

import type {FrameHost, FrameMarkup, ImageBytes} from './contract';

import type {FittedPlacement} from '../components/Frame/FittedWindow';
import {FrameView} from '../components/Frame/FrameView';
import {
  frameMediaRequest,
  resolveFrameMedia,
} from '../components/Frame/frameMedia';
import type {FrameMedia} from '../components/Frame/frameMedia';
import {
  TONE_SAMPLE_SIZE,
  toneSampleMarkup,
} from '../components/Frame/signatureTone';
import {getEditorStore} from '@codeimage/store/editor';
import type {PersistedFrameState as FrameAppearance} from '@codeimage/store/frame/model';
import type {CustomTheme} from '@codeimage/highlight';
import type {Language} from '@codemirror/language';

import type {AnimationHeader} from '@core/animation/model';

import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {THEME_REGISTRY} from '@codeimage/store/theme/themeRegistry';
import {SUPPORTED_FONTS} from '@core/configuration/font';

import type {JSX} from 'solid-js';
import {renderToStringAsync} from 'solid-js/web';
import {StateProvider} from 'statebuilder';

import {staticThemeCss} from '../components/CustomEditor/staticTheme';

import {page, serialize, SSR_OPTIONS, EXPORT_EXCLUDE_CSS} from './ssr';
export type RenderSnapshot = Omit<ProjectEditorPersistedState, 'frame'> & {
  width?: number;
  frame: Omit<PersistedFrameState, 'exportTarget' | 'aspectRatio'> &
    Partial<Pick<PersistedFrameState, 'exportTarget' | 'aspectRatio'>>;
};

export type Tab = RenderSnapshot['editor']['editors'][number];

export function findTab(snapshot: RenderSnapshot, editorId: string): Tab {
  const tab = snapshot.editor.editors.find(({id}) => id === editorId);
  if (!tab) throw new Error(`The snapshot has no tab "${editorId}"`);
  return tab;
}

export const NO_MARKS = {lines: [], focusedLines: []};

export interface LoadedFrame {
  theme: CustomTheme;
  fontName: string;
  appearance: FrameAppearance;
  media: FrameMedia;
  images: ImageBytes[];
  painted: boolean;
}

export async function loadFrame(
  snapshot: RenderSnapshot,
  host: FrameHost,
): Promise<LoadedFrame> {
  const {frame, editor} = snapshot;
  const {themeId, fontId} = editor.options;
  const themeDefinition = THEME_REGISTRY.find(theme => theme.id === themeId);
  if (!themeDefinition) throw new Error(`Unknown theme "${themeId}"`);
  const font = SUPPORTED_FONTS.find(font => font.id === fontId);
  if (!font) throw new Error(`Unknown font "${fontId}"`);
  const theme = await themeDefinition.load();
  const appearance = {
    ...frame,
    exportTarget: frame.exportTarget ?? null,
    aspectRatio: frame.aspectRatio ?? null,
    background: frame.background ?? theme.properties.previewBackground,
  };
  const {media, images} = await resolveFrameMedia(
    frameMediaRequest(appearance),
    image =>
      host.pixels(
        {
          html: toneSampleMarkup(image.src),
          css: [],
          images: [image],
          fontFamily: font.name,
        },
        TONE_SAMPLE_SIZE,
      ),
    host.offline,
  );
  const background = appearance.background ?? '';
  const hasBackgroundImage =
    !!media.backgroundImage || /gradient\(/i.test(background);
  const colorSample = hasBackgroundImage
    ? null
    : await host.pixels(
        {
          html: `<html><body style="margin:0"><div style="position:absolute;left:0;top:0;width:1px;height:1px;background-color:${background.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"></div></body></html>`,
          css: [],
          images: [],
          fontFamily: font.name,
        },
        1,
      );
  return {
    theme,
    fontName: font.name,
    appearance,
    media,
    images,
    painted: canHostWatermarkFrame({
      visible: appearance.visible,
      opacity: appearance.opacity,
      backgroundColor: colorSample
        ? `rgba(0, 0, 0, ${colorSample[3] / 255})`
        : 'transparent',
      hasImage: hasBackgroundImage,
    }),
  };
}

export interface Pass {
  appearance: FrameAppearance;

  editorId: string;
  language: Language | null;
  placement?: FittedPlacement;

  editor?: RenderSnapshot['editor'];

  code?: () => JSX.Element;

  animation?: StepOptions;
}

export interface StepOptions {
  header?: AnimationHeader;
  signatureWidth?: number;
}

export function renderBody(
  snapshot: RenderSnapshot,
  {theme, media}: LoadedFrame,
  pass: Pass,
): Promise<string> {
  const {terminal} = snapshot;
  return serialize(() => {
    const SnapshotFrame = () => {
      const store = getEditorStore();
      store.editor.actions.setFromPersistedState(
        pass.editor ?? snapshot.editor,
      );
      store.frame.setFromPersistedState(pass.appearance);
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
          tab={store.editor.state.editors.find(({id}) => id === pass.editorId)}
          theme={theme}
          language={pass.language}
          media={media}
          windowPlacement={pass.placement}
          showOnlyActiveTab={false}
          header={pass.animation?.header}
          natural={!!pass.animation}
          signatureWidth={pass.animation?.signatureWidth}
          code={pass.code?.()}
        />
      );
    };
    return renderToStringAsync(
      () => (
        <StateProvider>
          <SnapshotFrame />
        </StateProvider>
      ),
      SSR_OPTIONS,
    );
  });
}

export const frameMarkup = (
  {theme, fontName, images}: LoadedFrame,
  body: string,
): FrameMarkup => ({
  html: page(body),
  css: [staticThemeCss(theme), EXPORT_EXCLUDE_CSS],
  fontFamily: fontName,
  images,
});
