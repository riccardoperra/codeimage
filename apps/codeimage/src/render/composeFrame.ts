import type {Pass} from './frameState';

import {getExportTarget} from '@codeimage/config';
import {WATERMARK} from '@codeimage/render/watermark';
import {signatureScale} from '../components/Frame/signatureLayout';

import type {ComposedFrame, FrameHost} from './contract';

import {
  FITTED_WINDOW_MIN_WIDTH,
  fittedPlacement,
} from '../components/Frame/FittedWindow';
import type {FittedPlacement} from '../components/Frame/FittedWindow';
import {
  frameSignatureScale,
  targetViewport,
} from '../components/Frame/FrameView';

import type {PersistedFrameState as FrameAppearance} from '@codeimage/store/frame/model';

import {type StepLayout} from '@core/animation/timeline';

import {loadLanguage} from '@core/snapshot/tokenize';

import {findTab, loadFrame, renderBody, frameMarkup} from './frameState';
import type {RenderSnapshot, LoadedFrame} from './frameState';
import {frameSizeCss} from './frameSize';
export interface ComposedStep {
  frame: ComposedFrame;
  body: string;

  layout: StepLayout;
  placement?: FittedPlacement;
}

export async function composeStep(
  snapshot: RenderSnapshot,
  loaded: LoadedFrame,
  host: FrameHost,
  {
    editorId,
    language,
    animation,
  }: Pick<Pass, 'editorId' | 'language' | 'animation'>,
): Promise<ComposedStep> {
  const {frame} = snapshot;
  const {appearance, painted} = loaded;
  const target = getExportTarget(frame.exportTarget);
  const pass = (appearance: FrameAppearance, placement?: FittedPlacement) =>
    renderBody(snapshot, loaded, {
      appearance,
      editorId,
      language,
      placement,
      animation,
    });
  const watermarkFrame = (width: number) => ({
    painted,
    inset: WATERMARK.frameInset * signatureScale(width),
  });
  if (target) {
    const bare = frameMarkup(
      loaded,
      await pass({...appearance, exportTarget: null, signature: null}),
    );
    const natural = await host.measure({
      ...bare,
      css: [...bare.css, frameSizeCss()],
    });
    const window = {
      width: Math.max(
        FITTED_WINDOW_MIN_WIDTH,
        natural.width - frame.padding * 2,
      ),
      height: Math.max(1, natural.height - frame.padding * 2),
    };
    const viewport = targetViewport(
      target.resolution,
      frame.padding,
      frame.signature,
      frameSignatureScale({width: snapshot.width ?? 0}, target, {
        natural: !!animation,
        signatureWidth: animation?.signatureWidth,
      }),
    );
    const placement = fittedPlacement(viewport, {
      width: Math.round(window.width),
      height: Math.round(window.height),
    });
    const body = await pass(appearance, placement);
    const markup = frameMarkup(loaded, body);
    const size = {width: target.resolution[0], height: target.resolution[1]};
    return {
      frame: {
        ...markup,
        browserCss: markup.css,
        watermarkFrame: watermarkFrame(size.width),
        size,
      },
      body,
      layout: {
        size,
        window: {...placement, ...window},
      },
      placement,
    };
  }
  const body = await pass(appearance);
  const markup = frameMarkup(loaded, body);
  const natural = await host.measure({
    ...markup,
    css: [...markup.css, frameSizeCss()],
  });
  const size = {
    width: animation
      ? natural.width
      : Math.max(snapshot.width ?? 0, natural.width),
    height: natural.height,
  };
  return {
    frame: {
      ...markup,
      css: [...markup.css, frameSizeCss(size)],
      browserCss: markup.css,
      watermarkFrame: watermarkFrame(size.width),
      size: {width: Math.round(size.width), height: Math.round(size.height)},
    },
    body,
    layout: {size, window: null},
  };
}

export async function composeFrame(
  snapshot: RenderSnapshot,
  host: FrameHost,
  editorId = snapshot.editor.editors[0].id,
): Promise<ComposedFrame> {
  const tab = findTab(snapshot, editorId);
  const [loaded, language] = await Promise.all([
    loadFrame(snapshot, host),
    loadLanguage(tab.languageId, tab.tabName),
  ]);
  const step = await composeStep(snapshot, loaded, host, {
    editorId: tab.id,
    language,
  });
  return step.frame;
}
